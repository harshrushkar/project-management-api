<div align="center">

# 📋 Project Management API

A production-ready RESTful API for managing organizations, projects, and tasks — with JWT authentication, real-time notifications via Socket.IO, file uploads to Cloudinary, and email communication via Nodemailer.

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black)](https://swagger.io/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

**[Live API](https://project-management-api-one.vercel.app/api)** · **[Swagger Docs](https://project-management-api-one.vercel.app/api-docs)**

</div>

---

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Real-Time Notifications](#real-time-notifications)
- [File Uploads](#file-uploads)
- [Error Handling](#error-handling)
- [Tests](#tests)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Author](#author)

---

## Description

**Project Management API** is a backend service that enables teams to organize their work through a hierarchy of **Organizations → Projects → Tasks**. It provides complete user lifecycle management from registration through email verification to secure JWT-based login, and extends to organization membership, invitation workflows, project document management, and granular task tracking with status history.

The API is built with **Node.js + Express**, uses **PostgreSQL** via **Prisma ORM**, delivers real-time events through **Socket.IO**, stores uploaded files on **Cloudinary**, and sends transactional emails through **Nodemailer + Gmail SMTP**. The entire project is deployed as a serverless function on **Vercel** and is fully documented with an interactive **Swagger UI**.

---

## Features

### 🔐 Authentication & Security
- User registration with **bcrypt** password hashing (salt rounds: 10)
- Email verification via **6-digit OTP** (expires in 10 minutes, max 5 attempts)
- OTP resend with a **60-second cooldown** between requests
- JWT **access tokens** (15-minute expiry) and **refresh tokens** (7-day expiry)
- Secure **refresh token rotation** — old token is atomically revoked when rotated
- Refresh tokens stored as **SHA-256 hashes** in the database (never plaintext)
- Password reset via OTP → **reset authorization token** (10-minute window)
- On password reset, all active refresh tokens are revoked automatically
- **HTML injection prevention** via custom `escapeHTML` utility used in email content

### 🏢 Organizations
- Create, read, update, and delete organizations
- Organization **logo upload** via Cloudinary (JPEG, PNG, WebP)
- Role-based membership: `OWNER`, `ADMIN`, `MANAGER`, `MEMBER`
- Invite registered users to an organization with a specified role
- Invitation lifecycle: `PENDING` → `ACCEPTED` / `REJECTED` / `EXPIRED`
- Query **inviteable users** (registered users not yet in the organization)
- View all organization invitations

### 📁 Projects
- Create projects within an organization (requires membership)
- Attach **up to 10 documents** per project creation (`multipart/form-data`)
  - Accepted types: PDF, Word (`.doc`, `.docx`), Excel (`.xls`, `.xlsx`), images
  - Maximum file size: **10 MB per file**
- Project status: `PLANNING`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`, `CANCELLED`
- Optional `startDate` and `dueDate` scheduling
- Full CRUD: create, list, get by ID, update, delete

### ✅ Tasks
- Full task CRUD within a project
- Task status: `TODO`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`, `CANCELLED`
- Task priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- Assign and remove multiple **task members** from organization members
- Dedicated **status update** endpoint with automatic **status history tracking**
- Optional `dueDate` per task

### 🔔 Real-Time Notifications (Socket.IO)
- Authenticated Socket.IO connections (JWT verified on handshake)
- Each connected user is automatically joined to a **private room** (`user_<id>`)
- **Invitation decision notifications** — when an invitation is accepted or rejected, the inviter receives a real-time Socket.IO event: `organization_invitation_decision`
- Same decision also triggers an **email notification** to the inviter

### 📧 Email Notifications (Nodemailer)
- Gmail SMTP transport
- Emails sent for:
  - New user registration (OTP verification)
  - OTP resend
  - Password reset OTP
  - Invitation accepted/rejected

---

## Technology Stack

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js 5.x |
| ORM | Prisma 7.x |
| Database | PostgreSQL |
| Authentication | JSON Web Tokens (jsonwebtoken) |
| Password Hashing | bcrypt |
| File Uploads | Multer (memory storage) + Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Real-Time | Socket.IO 4.x |
| Validation | express-validator |
| API Documentation | swagger-jsdoc + custom CDN Swagger UI |
| Deployment | Vercel (serverless functions) |

---

## Architecture

This project uses a **modular, layered architecture**. Each domain (auth, organization, project, task) is self-contained under `src/modules/` and follows the same structure:

```
Request → Route → Validation Middleware → Auth Middleware → Controller → Service → Prisma → Database
```

| Layer | Responsibility |
|---|---|
| **Routes** (`*.routes.js`) | Define HTTP methods and URL patterns; apply middleware and validation chains |
| **Validation** (`*.validation.js`) | `express-validator` rule chains; `validateRequest` middleware halts on errors |
| **Auth Middleware** (`auth.middleware.js`) | Verifies JWT Bearer token; attaches `req.user` (`id`, `role`) to request |
| **Upload Middleware** (`upload.middleware.js`) | Multer memory-storage; enforces file type allowlist and 10 MB limit |
| **Controllers** (`*.controller.js`) | Thin HTTP layer — calls service, maps result to HTTP response |
| **Services** (`*.service.js`) | All business logic; interacts directly with Prisma |
| **Database** (`src/config/database.js`) | Singleton Prisma client instance |
| **Upload Service** (`upload.service.js`) | Streams file buffers to Cloudinary |
| **Email Service** (`email.service.js`) | Sends emails via Nodemailer transporter |
| **Notification Service** (`notification.service.js`) | Coordinates email + Socket.IO events for invitation decisions |
| **Socket** (`socket/socket.js`) | Initializes Socket.IO server; handles authenticated connections and private rooms |
| **Socket Middleware** (`socket/socket.middleware.js`) | Authenticates Socket.IO connections using the same JWT secret |
| **Config** (`src/config/`) | Cloudinary config, Nodemailer transporter, Swagger spec |
| **Utils** (`src/utils/`) | OTP generation/hashing, refresh token generation/hashing, password-reset token helpers, HTML escaping |
| **Docs** (`src/docs/`) | Swagger JSDoc annotation files for each module |
| **API Entry** (`api/index.js`) | Vercel serverless entry point — exports Express `app` |

---

## Project Structure

```text
project-management-api/
├── api/
│   └── index.js                    # Vercel serverless entry point
│
├── prisma/
│   ├── schema.prisma               # Database schema (all models and enums)
│   └── migrations/                 # Prisma migration history
│
├── src/
│   ├── server.js                   # Express app setup, routes, Swagger, Socket.IO init
│   │
│   ├── config/
│   │   ├── cloudinary.js           # Cloudinary SDK configuration
│   │   ├── database.js             # Prisma client singleton
│   │   ├── mail.js                 # Nodemailer transporter (Gmail SMTP)
│   │   └── swagger.js              # OpenAPI 3.0 spec generation (swagger-jsdoc)
│   │
│   ├── docs/                       # Swagger JSDoc annotation files
│   │   ├── auth.swagger.js
│   │   ├── organization.swagger.js
│   │   ├── project.swagger.js
│   │   └── task.swagger.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT Bearer token verification
│   │   └── upload.middleware.js    # Multer file upload (memory storage)
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   ├── organization/
│   │   │   ├── organization.controller.js
│   │   │   ├── organization.routes.js
│   │   │   ├── organization.service.js
│   │   │   └── organization.validation.js
│   │   ├── project/
│   │   │   ├── project.controller.js
│   │   │   ├── project.routes.js
│   │   │   ├── project.service.js
│   │   │   └── project.validation.js
│   │   └── task/
│   │       ├── task.controller.js
│   │       ├── task.routes.js
│   │       ├── task.service.js
│   │       └── task.validation.js
│   │
│   ├── services/
│   │   ├── email.service.js        # sendEmail() wrapper
│   │   ├── notification.service.js # Combined email + Socket.IO notification
│   │   └── upload.service.js       # Cloudinary stream upload
│   │
│   ├── socket/
│   │   ├── socket.js               # Socket.IO server initialization and event handlers
│   │   └── socket.middleware.js    # JWT authentication for Socket.IO connections
│   │
│   ├── templates/
│   │   └── verification-email.html # HTML email template
│   │
│   └── utils/
│       ├── escape-html.util.js     # HTML entity escaping for email content
│       ├── otp.util.js             # OTP generation, hashing, verification, expiry
│       ├── password-reset.util.js  # Reset authorization token generation and hashing
│       └── refresh-token.util.js   # Refresh token generation, SHA-256 hashing, expiry
│
├── tests/
│   ├── socket-test.js              # Socket.IO authenticated connection test
│   ├── socket-user1.js             # Socket.IO multi-user test (user 1)
│   ├── socket-user2.js             # Socket.IO multi-user test (user 2)
│   ├── test-db.js                  # Database connection test
│   ├── test-mail.js                # Email sending test
│   └── test-otp.js                 # OTP generation and hashing test
│
├── generated/
│   └── prisma/                     # Prisma-generated TypeScript types (gitignored)
│
├── .env                            # Local environment variables (gitignored)
├── .gitignore
├── api/index.js
├── package.json
├── prisma.config.ts                # Prisma configuration (schema path, migrations path)
├── vercel.json                     # Vercel deployment configuration
└── README.md
```

---

## Installation

### Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** database (local or cloud — e.g., Neon, Supabase, Railway)
- A **Cloudinary** account (free tier is sufficient)
- A **Gmail** account with an [App Password](https://support.google.com/accounts/answer/185833) for SMTP

### Clone and Install

```bash
git clone https://github.com/harshrushkar/project-management-api.git
cd project-management-api
npm install
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

# ─── JWT ──────────────────────────────────────────────────────────────────────
JWT_ACCESS_SECRET=your_jwt_access_secret_here

# ─── Cloudinary ───────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ─── Email (Gmail SMTP) ───────────────────────────────────────────────────────
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password

# ─── Testing (optional — for socket test scripts only) ────────────────────────
TEST_ACCESS_TOKEN=a_valid_jwt_access_token_for_local_testing
```

> [!CAUTION]
> **Never commit `.env` to version control.** The `.gitignore` already excludes it. Use safe placeholder values in any documentation.

### Variable Reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string for Prisma |
| `JWT_ACCESS_SECRET` | Secret key for signing and verifying JWT access tokens |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name (from the Cloudinary dashboard) |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `EMAIL_USER` | Gmail address used as the SMTP sender |
| `EMAIL_PASS` | Gmail App Password (**not** your Gmail login password) |
| `TEST_ACCESS_TOKEN` | Only required for running the local Socket.IO test scripts |

---

## Database Setup

This project uses **Prisma** with **PostgreSQL**.

### 1. Generate Prisma Client

```bash
npx prisma generate
```

This runs automatically on `npm install` via the `postinstall` script.

### 2. Run Migrations

```bash
npx prisma migrate deploy
```

This applies all existing migrations in `prisma/migrations/` to your database.

### 3. During Development (create a new migration)

```bash
npx prisma migrate dev --name describe_your_change
```

### 4. Inspect the Database (optional)

```bash
npx prisma studio
```

Opens Prisma Studio at `http://localhost:5555` to browse and edit database records.

### Database Schema Overview

```
User
 ├── EmailVerification   (OTP for email verification)
 ├── RefreshToken[]      (hashed refresh tokens)
 ├── PasswordReset       (OTP + reset authorization token)
 ├── OrganizationMember[](memberships with role)
 ├── OrganizationInvitation[] (sent and received)
 ├── Project[]           (created projects)
 ├── Task[]              (created and assigned tasks)
 ├── TaskMember[]        (task assignments)
 ├── TaskStatusHistory[] (audit of status changes)
 └── ProjectDocument[]   (uploaded documents)

Organization
 ├── OrganizationMember[]
 ├── OrganizationInvitation[]
 └── Project[]
      ├── ProjectDocument[]
      └── Task[]
           ├── TaskMember[]
           └── TaskStatusHistory[]
```

---

## Running the Project

### Development

```bash
npm run dev
```

Starts the server with **nodemon** at `http://localhost:3000`. The server auto-restarts on file changes.

### Production (local)

```bash
npm start
```

Starts the server with plain `node src/server.js`.

### Test Scripts

```bash
node tests/test-db.js       # Verify database connectivity
node tests/test-mail.js     # Send a test email
node tests/test-otp.js      # Test OTP generation and hashing
node tests/socket-test.js   # Test Socket.IO authenticated connection
node tests/socket-user1.js  # Socket.IO multi-user test (user 1)
node tests/socket-user2.js  # Socket.IO multi-user test (user 2)
```

> These are manual test scripts, not automated test-runner tests (no Jest/Mocha). Each script connects to `http://localhost:3000`, so the server must be running locally first.

---

## API Documentation

The API is documented with **Swagger UI** (OpenAPI 3.0).

### Local

Start the server and open:

```
http://localhost:3000/api-docs
```

### Production

```
https://project-management-api-one.vercel.app/api-docs
```

The Swagger UI lets you explore every endpoint, view request/response schemas, and execute requests directly from the browser using the **Authorize** button (paste your JWT access token).

The raw OpenAPI JSON spec is also available:

```
https://project-management-api-one.vercel.app/api-docs/swagger.json
```

---

## API Endpoints

All endpoints are prefixed with `/api`. Protected endpoints require:

```
Authorization: Bearer <access_token>
```

---

### 🔐 Authentication — `/api/auth`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (sends email OTP) | No |
| `POST` | `/api/auth/verify-email` | Verify email with OTP | No |
| `POST` | `/api/auth/resend-otp` | Resend email verification OTP | No |
| `POST` | `/api/auth/login` | Login and receive access + refresh tokens | No |
| `GET` | `/api/auth/profile` | Get the authenticated user's profile | ✅ Yes |
| `POST` | `/api/auth/refresh-token` | Rotate refresh token; get new access token | No |
| `POST` | `/api/auth/logout` | Revoke refresh token | No |
| `POST` | `/api/auth/forgot-password` | Send password reset OTP | No |
| `POST` | `/api/auth/verify-reset-otp` | Verify reset OTP; receive reset authorization token | No |
| `POST` | `/api/auth/reset-password` | Reset password using authorization token | No |

---

### 🏢 Organizations — `/api/organizations`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/organizations` | Create a new organization (logo upload optional) | ✅ Yes |
| `GET` | `/api/organizations/my-organizations` | List all organizations the user belongs to | ✅ Yes |
| `GET` | `/api/organizations/:organizationId` | Get organization details | ✅ Yes |
| `PUT` | `/api/organizations/:organizationId` | Update organization details (logo optional) | ✅ Yes |
| `DELETE` | `/api/organizations/:organizationId` | Delete an organization | ✅ Yes |
| `GET` | `/api/organizations/:organizationId/inviteable-users` | List users who can be invited | ✅ Yes |
| `POST` | `/api/organizations/:organizationId/invitations` | Invite a user to the organization | ✅ Yes |
| `PATCH` | `/api/organizations/invitations/:invitationId` | Accept or reject an invitation | ✅ Yes |
| `GET` | `/api/organizations/:organizationId/invitations` | List all invitations for an organization | ✅ Yes |

---

### 📁 Projects — `/api/organizations/:organizationId/projects`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/organizations/:organizationId/projects` | Create a project (with optional document uploads) | ✅ Yes |
| `GET` | `/api/organizations/:organizationId/projects` | List all projects in an organization | ✅ Yes |
| `GET` | `/api/organizations/:organizationId/projects/:projectId` | Get a single project by ID | ✅ Yes |
| `PUT` | `/api/organizations/:organizationId/projects/:projectId` | Update a project | ✅ Yes |
| `DELETE` | `/api/organizations/:organizationId/projects/:projectId` | Delete a project | ✅ Yes |

---

### ✅ Tasks — `/api/organizations/:organizationId/projects/:projectId/tasks`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `.../tasks` | Create a task in a project | ✅ Yes |
| `GET` | `.../tasks` | List all tasks in a project | ✅ Yes |
| `GET` | `.../tasks/:taskId` | Get a single task by ID | ✅ Yes |
| `PUT` | `.../tasks/:taskId` | Update a task | ✅ Yes |
| `DELETE` | `.../tasks/:taskId` | Delete a task | ✅ Yes |
| `POST` | `.../tasks/:taskId/members` | Assign members to a task | ✅ Yes |
| `DELETE` | `.../tasks/:taskId/members/:memberUserId` | Remove a member from a task | ✅ Yes |
| `PATCH` | `.../tasks/:taskId/status` | Update task status (creates status history entry) | ✅ Yes |

> For the full task base path: `/api/organizations/:organizationId/projects/:projectId/tasks`

---

## Authentication Flow

```
1. Register         POST /api/auth/register
                    └─ Account created → OTP emailed

2. Verify Email     POST /api/auth/verify-email  { email, otp }
                    └─ emailVerified = true

3. Login            POST /api/auth/login  { email, password }
                    └─ Returns: { accessToken (15m), refreshToken (7d) }

4. Authenticated    GET /api/auth/profile
   Requests         Authorization: Bearer <accessToken>

5. Token Refresh    POST /api/auth/refresh-token  { refreshToken }
                    └─ Old token revoked → New accessToken + refreshToken returned

6. Logout           POST /api/auth/logout  { refreshToken }
                    └─ Refresh token revoked in database

7. Forgot Password  POST /api/auth/forgot-password  { email }
                    └─ OTP emailed (email existence not revealed)

8. Verify OTP       POST /api/auth/verify-reset-otp  { email, otp }
                    └─ Returns: { resetAuthorizationToken (10m) }

9. Reset Password   POST /api/auth/reset-password  { resetAuthorizationToken, newPassword }
                    └─ Password updated → All refresh tokens revoked
```

**Security highlights:**
- Passwords hashed with bcrypt (cost factor 10)
- Refresh tokens stored as SHA-256 hashes — plaintext never persisted
- Refresh token rotation is atomic (Prisma transaction) — prevents race conditions
- Reset authorization token is single-use and time-bounded (10 minutes)
- OTP brute-force protection: max 5 attempts, 10-minute expiry
- OTP resend rate-limited: 60-second cooldown

---

## Real-Time Notifications

The server uses **Socket.IO** for real-time events. Socket connections are authenticated with the same JWT access token used for HTTP requests.

### Connecting

```js
import { io } from "socket.io-client";

const socket = io("https://project-management-api-one.vercel.app", {
  auth: {
    token: "<your_access_token>",
  },
});
```

> **Note:** Socket.IO real-time functionality requires a persistent server connection and is best tested in local development (`http://localhost:3000`). The Vercel deployment handles HTTP REST APIs correctly; WebSocket support on Vercel serverless depends on the plan and configuration.

### Events

| Event (listen) | Trigger | Payload |
|---|---|---|
| `organization_invitation_decision` | An invitation you sent was accepted/rejected | `{ invitationId, organizationId, organizationName, invitedUserId, invitedUserName, action, status, role }` |
| `receive_notification` | Test notification sent to your user room | `{ message, receivedAt }` |
| `receive_message` | Echo of a `send_message` event | `{ message, receivedAt }` |

---

## File Uploads

File uploads use **Multer** (memory storage) and are streamed directly to **Cloudinary**.

### Organization Logo

- Endpoint: `POST /api/organizations` and `PUT /api/organizations/:organizationId`
- Field name: `logo`
- Accepted types: `image/jpeg`, `image/png`, `image/webp`

### Project Documents

- Endpoint: `POST /api/organizations/:organizationId/projects`
- Field name: `documents` (array)
- Maximum files: **10 per request**
- Maximum size: **10 MB per file**
- Accepted types: PDF, Word (`.doc`, `.docx`), Excel (`.xls`, `.xlsx`), JPEG, PNG, WebP

All files are uploaded to Cloudinary using `resource_type: "auto"` and stored with their public ID for later deletion.

---

## Error Handling

All API responses follow a consistent JSON structure:

**Success response:**
```json
{
  "success": true,
  "message": "...",
  "data": { }
}
```

**Error response:**
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

**Validation error response:**
```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Name is required",
      "path": "name",
      "location": "body"
    }
  ]
}
```

**Common HTTP status codes:**

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `401` | Unauthenticated (missing or expired token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `500` | Internal server error |

---

## Tests

The `tests/` directory contains manual test scripts. These are standalone Node.js scripts, not automated test-suite tests.

```bash
# Requires server running on http://localhost:3000

node tests/test-db.js       # Test PostgreSQL connection via Prisma
node tests/test-mail.js     # Send a test email via Nodemailer
node tests/test-otp.js      # Verify OTP utility functions
node tests/socket-test.js   # Connect to Socket.IO as an authenticated user
node tests/socket-user1.js  # Simulate authenticated user 1 for multi-user tests
node tests/socket-user2.js  # Simulate authenticated user 2 for multi-user tests
```

The socket test scripts read `TEST_ACCESS_TOKEN` from `.env`.

---

## Deployment

This project is deployed on **Vercel** as a serverless Node.js function.

### How It Works

```
vercel.json
  └─ All requests (/*) → api/index.js (serverless function)
       └─ api/index.js exports src/server.js Express app
            └─ Express handles routing normally
```

### Deploy to Vercel

1. Push the repository to GitHub.
2. Import the repository in the [Vercel dashboard](https://vercel.com/dashboard).
3. Set all required **environment variables** in Vercel project settings (see [Environment Variables](#environment-variables)).
4. Vercel builds and deploys automatically on every push to the main branch.

You can also deploy via the Vercel CLI:

```bash
npm install -g vercel
vercel --prod
```

### Required Environment Variables on Vercel

Set the same variables as the local `.env` file in **Vercel → Project → Settings → Environment Variables**:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`

### Production URLs

| Resource | URL |
|---|---|
| REST API base | `https://project-management-api-one.vercel.app/api` |
| Swagger UI | `https://project-management-api-one.vercel.app/api-docs` |
| OpenAPI JSON spec | `https://project-management-api-one.vercel.app/api-docs/swagger.json` |

### Prisma on Vercel

The `postinstall` script (`prisma generate`) runs automatically during Vercel's build step. Run migrations separately against your production database:

```bash
npx prisma migrate deploy
```

---

## Contributing

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/your-feature-name`
4. **Make** your changes and test them locally
5. **Run** the relevant test scripts to verify nothing is broken
6. **Commit** with a clear message: `git commit -m "feat: add your feature description"`
7. **Push** to your fork: `git push origin feature/your-feature-name`
8. **Open** a Pull Request against the `main` branch

Please follow the existing code conventions — same module structure, same error response format, same validation approach.

---

## Author

**Harsh Rushkar**

GitHub: [@harshrushkar](https://github.com/harshrushkar)

