# Backend - Convivia Management System

REST API for managing guests, groups, and tables for a convivia. Built with Express, Prisma, and PostgreSQL.

## What does this project do?

Allows you to manage:
- **Guests**: create, edit, filter, and search guests. Handles main guests and plus-ones (+1).
- **Groups**: organize guests into groups (family, friends, work, etc.) to facilitate table assignment.
- **Tables**: define tables and assign guests (future functionality).

## Requirements

- Node.js 18.18 or higher (use `nvm use 18` if you have nvm)
- PostgreSQL running on port 5432

## Initial Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure database

Create a `.env` file in the root with:

```env
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/convivia"
PORT=3000
```

### 3. Create the database

If it doesn't exist, create it:

```bash
createdb convivia
```

Or from `psql`:
```sql
CREATE DATABASE convivia;
```

### 4. Apply migrations

```bash
npm run db:reset
```

This deletes everything and recreates tables from scratch. If you already have data and just want to apply new migrations:

```bash
npm run db:migrate
```

## Useful Commands

- `npm run dev` - Start development server (with hot reload)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run compiled version (production)
- `npm run db:generate` - Regenerate Prisma client after changing the schema
- `npm run db:reset` - Delete and recreate database with all migrations
- `npm run db:seed` - Load sample data (guests) into the database

## Project Structure

```
src/
├── controllers/     # HTTP endpoint logic
├── routes/          # Route definitions
├── services/        # Business logic and data access
├── client.ts        # Prisma client
└── index.ts         # Server entry point

prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Script to populate initial data
```

## Main Endpoints

- `GET /guests` - List guests (supports filters and search)
- `POST /guests` - Create a guest
- `PATCH /guests/:id` - Update a guest
- `DELETE /guests/:id` - Delete a guest
- `GET /groups` - List groups
- `POST /groups` - Create a group
- `PUT /groups/:id` - Update a group
- `DELETE /groups/:id` - Delete a group
- `POST /groups/:id/members` - Add members to a group
- `DELETE /groups/:id/members/:guestId` - Remove a member from a group

## Notes

- Server runs on `http://localhost:3000` by default (configurable with `PORT` in `.env`)
- CORS is enabled to allow requests from the frontend
- Avatars are served from `/static/avatars/` (from `public/` folder)
