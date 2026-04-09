# Users API

A REST API built with NestJS and Apache Cassandra for managing users, with JWT-based authentication.

The project follows a hexagonal architecture (ports & adapters), keeping the domain logic completely isolated from infrastructure concerns like HTTP and the database.

---

## Tech stack

- **NestJS** — framework
- **Apache Cassandra** — persistence (via `cassandra-driver`)
- **JWT** — authentication (`@nestjs/jwt` + `passport-jwt`)
- **bcrypt** — password hashing
- **class-validator** — request body validation

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- A running Cassandra instance on `localhost:9042`

The app creates the keyspace and tables automatically on startup, so no manual schema setup is needed.

### Install dependencies

```bash
pnpm install
```

### Environment variables

| Variable     | Description                        | Default    |
|--------------|------------------------------------|------------|
| `PORT`       | Port the server listens on         | `3000`     |
| `JWT_SECRET` | Secret used to sign JWT tokens     | `changeme` |

For production, always set a strong `JWT_SECRET`.

### Run

```bash
# development
pnpm start:dev

# production
pnpm build
pnpm start:prod
```

---

## Authentication

The API uses JWT Bearer tokens. Most endpoints require a valid token in the `Authorization` header:

```
Authorization: Bearer <token>
```

To get a token, call `POST /auth/login` with valid credentials. The token is valid for **1 day**.

The only public endpoints (no token required) are:
- `POST /auth/login`
- `POST /users` (registration)

---

## API reference

### Auth

#### `POST /auth/login`

Authenticates a user and returns an access token.

**Request body**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `200`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response `401`** — wrong email or password

---

### Users

#### `POST /users`

Creates a new user account. This endpoint is public.

**Request body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

Password must be at least 8 characters.

**Response `201`**
```json
{
  "id": "a1b2c3d4-...",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Response `409`** — email already in use

---

#### `GET /users` 🔒

Returns a paginated list of users.

**Query params**

| Param         | Type     | Default | Description                              |
|---------------|----------|---------|------------------------------------------|
| `pageSize`    | number   | `20`    | Number of results per page (max `100`)   |
| `pageState`   | string   | —       | Cursor returned by the previous response |

**Response `200`**
```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "nextPageState": "AQAAAA..." 
}
```

`nextPageState` is `null` when there are no more pages.

---

#### `GET /users/:id` 🔒

Returns a single user by ID.

**Response `200`**
```json
{
  "id": "a1b2c3d4-...",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Response `404`** — user not found

---

#### `PATCH /users/:id` 🔒

Updates a user's name and/or email. Both fields are optional.

**Request body**
```json
{
  "name": "John Updated",
  "email": "new@example.com"
}
```

**Response `200`** — updated user object

**Response `404`** — user not found  
**Response `409`** — new email already in use

---

#### `DELETE /users/:id` 🔒

Deletes a user.

**Response `204`** — no content

**Response `404`** — user not found

---

## Project structure

```
src/
├── app.module.ts
├── main.ts
├── features/
│   ├── auth/
│   │   ├── domain/               # exceptions, port interfaces, tokens
│   │   ├── application/          # login use case
│   │   ├── infrastructure/       # JWT strategy, guard, controller, DTOs
│   │   └── auth.module.ts
│   └── user/
│       ├── domain/               # User entity, value objects, exceptions, ports
│       ├── application/          # create, find, list, update, delete use cases
│       ├── infrastructure/       # HTTP controller, Cassandra repository, mappers
│       └── user.module.ts
└── shared/
    └── infrastructure/
        └── persistence/          # Cassandra client (global module)
```

The architecture separates each feature into three layers:

- **Domain** — pure business logic, no framework dependencies. Entities, value objects, and abstract port interfaces live here.
- **Application** — use cases that orchestrate the domain. They depend only on port interfaces, never on concrete implementations.
- **Infrastructure** — everything that touches the outside world: HTTP controllers, database repositories, and authentication strategies.

This means you could swap Cassandra for PostgreSQL, or replace Passport with a custom auth mechanism, without touching a single line of domain or application code.

---

## Cassandra schema

The app auto-creates these tables on startup:

```cql
CREATE KEYSPACE IF NOT EXISTS app
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

CREATE TABLE IF NOT EXISTS app.users (
  id           uuid,
  name         text,
  email        text,
  password_hash text,
  created_at   timestamp,
  updated_at   timestamp,
  PRIMARY KEY (id)
);

-- lookup table to find users by email efficiently
CREATE TABLE IF NOT EXISTS app.users_by_email (
  email text,
  id    uuid,
  PRIMARY KEY (email)
);
```

The `users_by_email` table exists because Cassandra doesn't support secondary index lookups at scale. Keeping a separate table keyed by email makes `findByEmail` queries fast without a full table scan.
