import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import Database from "better-sqlite3";
import express from "express";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || "replace-this-development-secret-before-production";
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && jwtSecret === "replace-this-development-secret-before-production") {
  throw new Error("JWT_SECRET must be set when NODE_ENV=production.");
}

const db = new Database(process.env.DB_PATH || path.join(__dirname, "gasflow.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at
    ON password_reset_tokens (expires_at);
`);

function hasColumn(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((entry) => entry.name === column);
}

function migrateDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      currency_code TEXT NOT NULL DEFAULT 'GHS' CHECK (currency_code = 'GHS'),
      active_rate_pesewas_per_kg INTEGER NOT NULL DEFAULT 1500 CHECK (active_rate_pesewas_per_kg > 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS gas_rate_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      rate_pesewas_per_kg INTEGER NOT NULL CHECK (rate_pesewas_per_kg > 0),
      set_by_user_id INTEGER,
      effective_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
      FOREIGN KEY (set_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS gas_rate_history_station_effective_at
      ON gas_rate_history (station_id, effective_at DESC);
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      delivery_address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS customers_station_name
      ON customers (station_id, name COLLATE NOCASE);
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      customer_id INTEGER,
      created_by_user_id INTEGER NOT NULL,
      cylinder_weight_grams INTEGER NOT NULL CHECK (cylinder_weight_grams > 0),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      rate_pesewas_per_kg INTEGER NOT NULL CHECK (rate_pesewas_per_kg > 0),
      total_pesewas INTEGER NOT NULL CHECK (total_pesewas >= 0),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mobile_money', 'credit')),
      delivery_location TEXT,
      status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'voided')),
      sold_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS sales_station_sold_at ON sales (station_id, sold_at DESC);
    CREATE INDEX IF NOT EXISTS sales_customer_status ON sales (customer_id, status);
    CREATE TABLE IF NOT EXISTS sale_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      amount_pesewas INTEGER NOT NULL CHECK (amount_pesewas > 0),
      method TEXT NOT NULL CHECK (method IN ('cash', 'mobile_money', 'credit_settlement')),
      reference TEXT,
      received_by_user_id INTEGER,
      received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
      FOREIGN KEY (received_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS sale_payments_sale_received_at ON sale_payments (sale_id, received_at DESC);
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      cylinder_weight_grams INTEGER NOT NULL CHECK (cylinder_weight_grams > 0),
      quantity_change INTEGER NOT NULL CHECK (quantity_change <> 0),
      movement_type TEXT NOT NULL CHECK (movement_type IN ('opening_stock', 'delivery', 'sale', 'adjustment', 'return')),
      reference_sale_id INTEGER,
      note TEXT,
      recorded_by_user_id INTEGER,
      recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
      FOREIGN KEY (reference_sale_id) REFERENCES sales(id) ON DELETE SET NULL,
      FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS inventory_movements_station_weight_recorded_at
      ON inventory_movements (station_id, cylinder_weight_grams, recorded_at DESC);
  `);

  if (!hasColumn("users", "station_id")) db.exec("ALTER TABLE users ADD COLUMN station_id INTEGER REFERENCES stations(id)");
  if (!hasColumn("users", "role")) db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'manager'");

  const assignExistingUsers = db.transaction(() => {
    const usersWithoutStation = db.prepare("SELECT id, name FROM users WHERE station_id IS NULL").all();
    const createStation = db.prepare("INSERT INTO stations (name) VALUES (?)");
    const setStation = db.prepare("UPDATE users SET station_id = ? WHERE id = ?");
    const setInitialRate = db.prepare("INSERT INTO gas_rate_history (station_id, rate_pesewas_per_kg, set_by_user_id) VALUES (?, 1500, ?)");
    for (const user of usersWithoutStation) {
      const station = createStation.run(`${user.name}'s Station`);
      setStation.run(station.lastInsertRowid, user.id);
      setInitialRate.run(station.lastInsertRowid, user.id);
    }
  });
  assignExistingUsers();
}

migrateDatabase();

const app = express();
app.disable("x-powered-by");
const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header include health checks and command-line
      // diagnostics. Browser requests must use one of the configured origins.
      if (!origin || clientOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CLIENT_ORIGIN.`));
    },
  })
);
app.use(express.json({ limit: "16kb" }));

const loginAttempts = new Map();
const loginLimit = 10;
const loginWindowMs = 15 * 60 * 1000;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    stationId: user.station_id,
    role: user.role,
    createdAt: user.created_at,
  };
}

function createToken(user) {
  return jwt.sign({ sub: String(user.id), email: user.email }, jwtSecret, {
    expiresIn: "7d",
  });
}

const hashResetToken = (token) => createHash("sha256").update(token).digest("hex");

async function sendPasswordResetEmail({ email, name, resetToken }) {
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const resetUrl = new URL("/", clientOrigin);
  resetUrl.searchParams.set("reset_token", resetToken);

  if (!process.env.RESEND_API_KEY) {
    if (isProduction) throw new Error("Password reset email delivery is not configured.");
    return { developmentCode: resetToken };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESET_EMAIL_FROM || "GasFlow <onboarding@resend.dev>",
      to: [email],
      subject: "Reset your GasFlow password",
      html: `<p>Hello ${name},</p><p>Use the link below to reset your GasFlow password. It expires in one hour.</p><p><a href="${resetUrl.toString()}">Reset password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
    }),
  });

  if (!response.ok) throw new Error("Password reset email delivery failed.");
  return {};
}

function authenticate(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Authentication is required." });

  try {
    req.auth = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

function requireStation(req, res, next) {
  const user = db.prepare("SELECT id, station_id, role FROM users WHERE id = ?").get(req.auth.sub);
  if (!user?.station_id) return res.status(403).json({ error: "This account is not assigned to a station." });
  req.user = user;
  return next();
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function normalizePaymentMethod(value) {
  const method = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, "_");
  if (method === "cash") return "cash";
  if (method === "mobile_money" || method === "momo") return "mobile_money";
  if (method === "credit" || method === "credit/debt" || method === "credit_debt") return "credit";
  return null;
}

function validateCredentials({ name, email, password }, needsName) {
  const cleanName = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (needsName && (cleanName.length < 2 || cleanName.length > 80)) {
    return { error: "Enter a name between 2 and 80 characters." };
  }
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 254) {
    return { error: "Enter a valid work email address." };
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return { error: "Password must be between 8 and 128 characters." };
  }

  return { name: cleanName, email: cleanEmail, password };
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "gasflow-api" }));

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const input = validateCredentials(req.body || {}, true);
    if (input.error) return res.status(400).json({ error: input.error });

    const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(input.email);
    if (exists) return res.status(409).json({ error: "An account already exists for this email." });

    const passwordHash = await bcrypt.hash(input.password, 12);
    const createAccount = db.transaction(() => {
      const station = db.prepare("INSERT INTO stations (name) VALUES (?)").run(`${input.name}'s Station`);
      const userResult = db
        .prepare("INSERT INTO users (name, email, password_hash, station_id) VALUES (?, ?, ?, ?)")
        .run(input.name, input.email, passwordHash, station.lastInsertRowid);
      db.prepare("INSERT INTO gas_rate_history (station_id, rate_pesewas_per_kg, set_by_user_id) VALUES (?, 1500, ?)")
        .run(station.lastInsertRowid, userResult.lastInsertRowid);
      return userResult.lastInsertRowid;
    });
    const userId = createAccount();
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

    return res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  const clientKey = req.ip;
  const attempt = loginAttempts.get(clientKey);
  if (attempt && attempt.count >= loginLimit && Date.now() - attempt.startedAt < loginWindowMs) {
    return res.status(429).json({ error: "Too many sign-in attempts. Try again in 15 minutes." });
  }

  try {
    const input = validateCredentials(req.body || {}, false);
    if (input.error) return res.status(400).json({ error: input.error });

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(input.email);
    const passwordMatches = user && (await bcrypt.compare(input.password, user.password_hash));
    if (!passwordMatches) {
      const current = loginAttempts.get(clientKey);
      loginAttempts.set(clientKey, {
        count: (current?.count || 0) + 1,
        startedAt: current?.startedAt || Date.now(),
      });
      return res.status(401).json({ error: "Email or password is incorrect." });
    }

    loginAttempts.delete(clientKey);
    return res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/request-password-reset", async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: "Enter a valid work email address." });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    // Always use the same response for unknown accounts to prevent account discovery.
    if (!user) {
      return res.json({ message: "If an account exists for that email, a reset link has been sent." });
    }

    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at <= CURRENT_TIMESTAMP").run(user.id);
    db.prepare("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)")
      .run(user.id, hashResetToken(resetToken), expiresAt);

    const delivery = await sendPasswordResetEmail({ email: user.email, name: user.name, resetToken });
    return res.json({
      message: "If an account exists for that email, a reset link has been sent.",
      ...(delivery.developmentCode ? { developmentCode: delivery.developmentCode } : {}),
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/reset-password", async (req, res, next) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const password = req.body?.password;
    if (!token || typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: "Use a valid reset link and a password between 8 and 128 characters." });
    }

    const resetRecord = db.prepare(`
      SELECT password_reset_tokens.id, password_reset_tokens.user_id
      FROM password_reset_tokens
      WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP
    `).get(hashResetToken(token));
    if (!resetRecord) return res.status(400).json({ error: "This reset link is invalid or has expired." });

    const passwordHash = await bcrypt.hash(password, 12);
    const resetPassword = db.transaction(() => {
      db.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(passwordHash, resetRecord.user_id);
      db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(resetRecord.user_id);
    });
    resetPassword();

    return res.json({ message: "Your password has been reset. You can now sign in." });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/auth/me", authenticate, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.auth.sub);
  if (!user) return res.status(401).json({ error: "This account no longer exists." });
  return res.json({ user: publicUser(user) });
});

app.patch("/api/auth/me", authenticate, async (req, res, next) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.auth.sub);
    if (!user) return res.status(401).json({ error: "This account no longer exists." });

    const name = typeof req.body?.name === "string" ? req.body.name.trim().replace(/\s+/g, " ") : user.name;
    const password = req.body?.password;
    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "Enter a name between 2 and 80 characters." });
    }
    if (password !== undefined && (typeof password !== "string" || password.length < 8 || password.length > 128)) {
      return res.status(400).json({ error: "Password must be between 8 and 128 characters." });
    }

    const passwordHash = password ? await bcrypt.hash(password, 12) : user.password_hash;
    db.prepare("UPDATE users SET name = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(name, passwordHash, user.id);
    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    return res.json({ user: publicUser(updatedUser) });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/station", authenticate, requireStation, (req, res) => {
  const station = db.prepare("SELECT * FROM stations WHERE id = ?").get(req.user.station_id);
  return res.json({ station });
});

app.get("/api/station/rates", authenticate, requireStation, (req, res) => {
  const rates = db.prepare(`
    SELECT gas_rate_history.id, gas_rate_history.rate_pesewas_per_kg, gas_rate_history.effective_at, users.name AS set_by
    FROM gas_rate_history
    LEFT JOIN users ON users.id = gas_rate_history.set_by_user_id
    WHERE gas_rate_history.station_id = ?
    ORDER BY gas_rate_history.effective_at DESC, gas_rate_history.id DESC
  `).all(req.user.station_id);
  return res.json({ rates });
});

app.put("/api/station/rate", authenticate, requireStation, (req, res) => {
  if (req.user.role !== "manager") return res.status(403).json({ error: "Only station managers can update the gas rate." });
  const ratePesewasPerKg = positiveInteger(req.body?.ratePesewasPerKg);
  if (!ratePesewasPerKg || ratePesewasPerKg > 100000) {
    return res.status(400).json({ error: "Enter a valid rate in pesewas per kilogram." });
  }

  const saveRate = db.transaction(() => {
    db.prepare("UPDATE stations SET active_rate_pesewas_per_kg = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(ratePesewasPerKg, req.user.station_id);
    db.prepare("INSERT INTO gas_rate_history (station_id, rate_pesewas_per_kg, set_by_user_id) VALUES (?, ?, ?)")
      .run(req.user.station_id, ratePesewasPerKg, req.user.id);
  });
  saveRate();
  return res.json({ ratePesewasPerKg });
});

app.get("/api/customers", authenticate, requireStation, (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const customers = db.prepare(`
    SELECT id, name, phone, delivery_address, notes, created_at, updated_at
    FROM customers
    WHERE station_id = ? AND (? = '' OR name LIKE '%' || ? || '%' COLLATE NOCASE)
    ORDER BY name COLLATE NOCASE
    LIMIT 100
  `).all(req.user.station_id, search, search);
  return res.json({ customers });
});

app.post("/api/sales", authenticate, requireStation, (req, res, next) => {
  try {
    const customerName = typeof req.body?.customerName === "string" ? req.body.customerName.trim().replace(/\s+/g, " ") : "";
    const cylinderWeightGrams = positiveInteger(req.body?.cylinderWeightGrams);
    const quantity = positiveInteger(req.body?.quantity);
    const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod);
    const deliveryLocation = typeof req.body?.deliveryLocation === "string" ? req.body.deliveryLocation.trim() : null;
    if (customerName.length < 2 || customerName.length > 120 || !cylinderWeightGrams || !quantity || !paymentMethod) {
      return res.status(400).json({ error: "Provide a customer, cylinder weight, quantity, and payment method." });
    }
    if (cylinderWeightGrams > 100000 || quantity > 1000) return res.status(400).json({ error: "The cylinder weight or quantity is too large." });

    const station = db.prepare("SELECT active_rate_pesewas_per_kg FROM stations WHERE id = ?").get(req.user.station_id);
    const totalPesewas = (cylinderWeightGrams * station.active_rate_pesewas_per_kg * quantity) / 1000;
    if (!Number.isSafeInteger(totalPesewas)) return res.status(400).json({ error: "The sale total could not be calculated safely." });
    const requestedPaid = req.body?.amountPaidPesewas === undefined ? totalPesewas : positiveInteger(req.body.amountPaidPesewas);
    const amountPaidPesewas = paymentMethod === "credit" ? (requestedPaid || 0) : totalPesewas;
    if (amountPaidPesewas > totalPesewas) return res.status(400).json({ error: "Payment cannot exceed the sale total." });

    const createSale = db.transaction(() => {
      let customer = db.prepare("SELECT id FROM customers WHERE station_id = ? AND name = ? COLLATE NOCASE ORDER BY id LIMIT 1")
        .get(req.user.station_id, customerName);
      if (!customer) {
        const result = db.prepare("INSERT INTO customers (station_id, name, phone, delivery_address) VALUES (?, ?, ?, ?)")
          .run(req.user.station_id, customerName, req.body?.phone?.trim() || null, deliveryLocation);
        customer = { id: result.lastInsertRowid };
      }
      const saleResult = db.prepare(`
        INSERT INTO sales (station_id, customer_id, created_by_user_id, cylinder_weight_grams, quantity, rate_pesewas_per_kg, total_pesewas, payment_method, delivery_location)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.station_id, customer.id, req.user.id, cylinderWeightGrams, quantity, station.active_rate_pesewas_per_kg, totalPesewas, paymentMethod, deliveryLocation);
      if (amountPaidPesewas > 0) {
        db.prepare("INSERT INTO sale_payments (sale_id, station_id, amount_pesewas, method, received_by_user_id) VALUES (?, ?, ?, ?, ?)")
          .run(saleResult.lastInsertRowid, req.user.station_id, amountPaidPesewas, paymentMethod === "mobile_money" ? "mobile_money" : "cash", req.user.id);
      }
      db.prepare("INSERT INTO inventory_movements (station_id, cylinder_weight_grams, quantity_change, movement_type, reference_sale_id, recorded_by_user_id) VALUES (?, ?, ?, 'sale', ?, ?)")
        .run(req.user.station_id, cylinderWeightGrams, -quantity, saleResult.lastInsertRowid, req.user.id);
      return saleResult.lastInsertRowid;
    });
    const saleId = createSale();
    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(saleId);
    return res.status(201).json({ sale });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/sales", authenticate, requireStation, (req, res) => {
  const sales = db.prepare(`
    SELECT
      sales.id,
      customers.name AS customer_name,
      sales.cylinder_weight_grams,
      sales.quantity,
      sales.rate_pesewas_per_kg,
      sales.total_pesewas,
      sales.payment_method,
      sales.delivery_location,
      REPLACE(sales.sold_at, ' ', 'T') || 'Z' AS sold_at,
      COALESCE(SUM(CASE WHEN sale_payments.method = 'mobile_money' THEN sale_payments.amount_pesewas ELSE 0 END), 0) AS mobile_money_paid_pesewas,
      COALESCE(SUM(CASE WHEN sale_payments.method IN ('cash', 'credit_settlement') THEN sale_payments.amount_pesewas ELSE 0 END), 0) AS cash_paid_pesewas
    FROM sales
    LEFT JOIN customers ON customers.id = sales.customer_id
    LEFT JOIN sale_payments ON sale_payments.sale_id = sales.id
    WHERE sales.station_id = ? AND sales.status = 'completed'
    GROUP BY sales.id
    ORDER BY sales.sold_at DESC, sales.id DESC
    LIMIT 1000
  `).all(req.user.station_id);
  return res.json({ sales });
});

app.get("/api/debts", authenticate, requireStation, (req, res) => {
  const debts = db.prepare(`
    SELECT sales.id AS sale_id, customers.id AS customer_id, customers.name AS customer_name,
      sales.cylinder_weight_grams, sales.quantity, sales.total_pesewas,
      COALESCE(SUM(sale_payments.amount_pesewas), 0) AS paid_pesewas,
      sales.sold_at
    FROM sales
    JOIN customers ON customers.id = sales.customer_id
    LEFT JOIN sale_payments ON sale_payments.sale_id = sales.id
    WHERE sales.station_id = ? AND sales.status = 'completed'
    GROUP BY sales.id
    HAVING sales.total_pesewas > COALESCE(SUM(sale_payments.amount_pesewas), 0)
    ORDER BY sales.sold_at DESC
  `).all(req.user.station_id);
  return res.json({ debts: debts.map((debt) => ({ ...debt, balance_pesewas: debt.total_pesewas - debt.paid_pesewas })) });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ error: "Something went wrong. Please try again." });
});

export { app, db };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  app.listen(port, () => console.log(`GasFlow API listening on http://localhost:${port}`));
}
