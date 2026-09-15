# GasFlow

GasFlow is a Vite + React workspace with a local Express authentication API.

## Run locally

Install dependencies, then start both the API and web app together:

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` requests to the API at `http://localhost:4000`. Use `npm run server` or `npm run dev:client` individually only when you specifically need one service. User accounts are stored locally in `gasflow.db` (which is ignored by Git).

## Environment

Copy `.env.example` to `.env` before deployment and replace `JWT_SECRET` with a long random secret. In production, also set `CLIENT_ORIGIN` to the deployed web-app origin and `VITE_API_URL` to the API base URL when the frontend and API use separate origins.

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
