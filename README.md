# Faculty Management Dashboard — Backend

A production-ready backend for a Faculty Management Dashboard built with Node.js, TypeScript, Express.js, Prisma ORM, Cloudinary, and JWT authentication.

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **Framework:** Express.js
- **Database:** PostgreSQL via Prisma ORM
- **File Storage:** Cloudinary (via multer + streamifier)
- **Task Scheduling:** node-cron
- **Auth:** JWT + bcrypt

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Set up the database

```bash
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma migrate dev --schema=src/prisma/schema.prisma --name init
```

### 4. Seed the first MANAGEMENT user

Since registration is not in scope, create the first MANAGEMENT user directly via `psql`:

```sql
-- Generate a bcrypt hash for your desired password first.
-- You can use Node.js to do this:
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(h => console.log(h))"

INSERT INTO "User" (id, email, "passwordHash", name, role, department, "createdAt")
VALUES (
  gen_random_uuid(),
  'admin@university.edu',
  '$2b$10$YOUR_BCRYPT_HASH_HERE',
  'Admin User',
  'MANAGEMENT',
  'Administration',
  NOW()
);
```

Alternatively, create a FACULTY user:

```sql
INSERT INTO "User" (id, email, "passwordHash", name, role, department, "createdAt")
VALUES (
  gen_random_uuid(),
  'faculty@university.edu',
  '$2b$10$YOUR_BCRYPT_HASH_HERE',
  'Faculty Member',
  'FACULTY',
  'Computer Science',
  NOW()
);
```

### 5. Run the server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

| Method | Endpoint                    | Auth     | Role       | Description                          |
| ------ | --------------------------- | -------- | ---------- | ------------------------------------ |
| POST   | `/api/auth/login`           | No       | Any        | Login and receive JWT                |
| POST   | `/api/progress`             | JWT      | Any        | Submit weekly progress               |
| GET    | `/api/progress/my-courses`  | JWT      | Any        | Get courses with latest progress     |
| POST   | `/api/certifications/upload`| JWT      | Any        | Upload a certification document      |
| POST   | `/api/forms/templates`      | JWT      | MANAGEMENT | Create a dynamic form template       |
| GET    | `/api/forms/templates`      | JWT      | MANAGEMENT | List all form templates              |
| GET    | `/api/forms/active`         | JWT      | Any        | List active form templates           |
| POST   | `/api/forms/submit`         | JWT      | FACULTY    | Submit a dynamic form                |
| GET    | `/api/health`               | No       | Any        | Health check                         |

## Cron Jobs

- **Friday Reminder** (`0 15 * * 5`): Finds faculty who haven't submitted progress for the current week and sends a reminder.
- **Sunday Lock** (`59 23 * * 0`): Locks all weekly progress records for the current week.
