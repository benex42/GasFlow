# GasFlow

GasFlow is a Vite + React workspace with a local Express authentication API.

## Run locally

Install dependencies, then start both the API and web app together:

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` requests to the API at `http://localhost:4000`. Use `npm run server` or `npm run dev:client` individually only when you specifically need one service. The API uses the Neon Postgres connection supplied as `DATABASE_URL`.

## Environment

Copy `.env.example` to `.env`, add your Neon `DATABASE_URL`, and replace `JWT_SECRET` with a long random secret. In production, set `CLIENT_ORIGIN` to the deployed web-app origin.

## Production deployment: Vercel + Neon

The frontend and API deploy together on Vercel. The API is the `api/[...path].js` Vercel Function and uses Neon Postgres for persistent data. The frontend continues to call `/api`, so `VITE_API_URL` is not needed.

1. Create a free Neon project and copy its connection string from **Connect**.
2. In **Vercel → Project → Settings → Environment Variables**, add:

   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=<a long random value>
   CLIENT_ORIGIN=https://your-app.vercel.app
   NODE_ENV=production
   ```

   Remove any previous `VITE_API_URL` variable, or set it to `/api`, so the frontend calls the API function on the same Vercel deployment.

3. Redeploy Vercel. The API automatically creates its schema at first request.
4. Visit `https://your-app.vercel.app/api/health`; it should return `{"status":"ok","service":"gasflow-api","database":"postgres"}`.

`CLIENT_ORIGIN` may contain comma-separated exact origins if you also use a custom domain or Vercel preview URL.

## Authentication API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
- `GET /api/auth/me` (Bearer token)
- `PATCH /api/auth/me` (Bearer token)

Passwords are hashed with bcrypt and sessions are signed JWTs that expire after seven days.

Password-reset links expire after one hour and can only be used once. Set `RESEND_API_KEY` and `RESET_EMAIL_FROM` to send them in production. Locally, the reset screen receives a development-only code so the complete flow can be tested without an email provider.

## Depot data API

Every account owns a station and all records are scoped to that station. Currency is stored as integer pesewas (for example, `1500` is GH₵15.00), so totals do not lose precision through floating-point arithmetic.

- `GET /api/station`
- `GET /api/station/rates`
- `PUT /api/station/rate`
- `GET /api/customers`
- `POST /api/sales`
- `GET /api/sales`
- `GET /api/debts`

The database includes stations, gas-rate history, customers, sales, payments, and inventory movements. Existing users are automatically assigned their own station when the app next starts.
