# Requirements Document

## Introduction

Módulo de gerenciamento de usuários em NestJS 11 seguindo arquitetura hexagonal (Ports & Adapters). O sistema expõe uma API REST com operações CRUD completas (criar, buscar por ID, listar, atualizar, deletar), mantendo o domínio isolado de detalhes de infraestrutura. Cassandra é utilizado como banco de dados primário, com denormalização para suporte a lookup por email.

## Glossary

- **System**: O módulo de gerenciamento de usuários NestJS
- **User**: Agregado raiz do domínio representando um usuário cadastrado
- **UserId**: Value object que encapsula um UUID v4 gerado pelo domínio
- **Email**: Value object que encapsula e valida um endereço de email no formato RFC 5322
- **UserRepository**: Port outbound que abstrai a persistência de usuários
- **UseCase**: Componente da camada de aplicação que orquestra o fluxo de negócio
- **Controller**: Adapter HTTP que traduz requisições REST para chamadas de use cases
- **DTO**: Data Transfer Object usado para entrada e saída na camada HTTP
- **Mapper**: Componente que converte entre entidades de domínio e modelos de persistência
- **PasswordHash**: Hash bcrypt da senha do usuário, nunca armazenado em plain text

---

## Requirements

### Requirement 1: Criar Usuário

**User Story:** As a client application, I want to create a new user via REST API, so that I can register users in the system.

#### Acceptance Criteria

1. WHEN a POST request is received at `/users` with valid `name`, `email`, and `password` fields, THE System SHALL create a new User and return HTTP 201 with `id`, `name`, `email`, and `createdAt`
2. WHEN a User is created, THE System SHALL generate a UUID v4 as the UserId in the domain layer, not accepting client-provided IDs
3. WHEN a User is created, THE System SHALL store a bcrypt hash of the password with a minimum of 10 salt rounds, never storing the plain text password
4. WHEN a User is created, THE System SHALL set `createdAt` and `updatedAt` to the same timestamp
5. WHEN a POST request is received with an `email` that already exists in the system, THE System SHALL return HTTP 409 with `{ "message": "Email already in use" }`
6. IF the `name` field is empty or missing, THEN THE System SHALL return HTTP 400 with a validation error
7. IF the `email` field is not a valid RFC 5322 email format, THEN THE System SHALL return HTTP 400 with a validation error
8. IF the `password` field has fewer than 8 characters, THEN THE System SHALL return HTTP 400 with a validation error
9. WHEN a User is created, THE System SHALL persist the user in both the `users` table and the `users_by_email` table

### Requirement 2: Buscar Usuário por ID

**User Story:** As a client application, I want to retrieve a user by their ID, so that I can display or process user information.

#### Acceptance Criteria

1. WHEN a GET request is received at `/users/:id` with a valid UUID, THE System SHALL return HTTP 200 with `id`, `name`, `email`, and `createdAt`
2. WHEN a GET request is received at `/users/:id` and no User exists with that ID, THE System SHALL return HTTP 404 with `{ "message": "User not found" }`
3. WHEN a User is returned in any HTTP response, THE System SHALL omit the `passwordHash` field from the response body

### Requirement 3: Listar Usuários

**User Story:** As a client application, I want to list all users, so that I can display or process the full user collection.

#### Acceptance Criteria

1. WHEN a GET request is received at `/users`, THE System SHALL return HTTP 200 with an array of all users, each containing `id`, `name`, `email`, and `createdAt`
2. WHEN no users exist, THE System SHALL return HTTP 200 with an empty array
3. WHEN users are returned in a list response, THE System SHALL omit the `passwordHash` field from each user in the response body

### Requirement 4: Atualizar Usuário

**User Story:** As a client application, I want to update an existing user's data, so that I can keep user information current.

#### Acceptance Criteria

1. WHEN a PATCH request is received at `/users/:id` with at least one valid field (`name` or `email`), THE System SHALL update the User and return HTTP 200 with the updated `id`, `name`, `email`, and `createdAt`
2. WHEN a User is updated, THE System SHALL set `updatedAt` to a timestamp strictly after the previous `updatedAt` value
3. WHEN a PATCH request contains only a subset of fields, THE System SHALL leave unspecified fields unchanged
4. WHEN a PATCH request is received at `/users/:id` and no User exists with that ID, THE System SHALL return HTTP 404 with `{ "message": "User not found" }`
5. WHEN a PATCH request is received with an `email` that belongs to a different existing User, THE System SHALL return HTTP 409 with `{ "message": "Email already in use" }`
6. IF the `name` field is present but empty in a PATCH request, THEN THE System SHALL return HTTP 400 with a validation error
7. IF the `email` field is present but not a valid RFC 5322 format in a PATCH request, THEN THE System SHALL return HTTP 400 with a validation error

### Requirement 5: Deletar Usuário

**User Story:** As a client application, I want to delete a user by their ID, so that I can remove users from the system.

#### Acceptance Criteria

1. WHEN a DELETE request is received at `/users/:id` for an existing User, THE System SHALL delete the User and return HTTP 204 with no body
2. WHEN a DELETE request is received at `/users/:id` and no User exists with that ID, THE System SHALL return HTTP 404 with `{ "message": "User not found" }`

### Requirement 6: Domínio e Value Objects

**User Story:** As a developer, I want the domain layer to enforce business invariants, so that invalid states are impossible to represent.

#### Acceptance Criteria

1. WHEN an Email value object is constructed with an invalid RFC 5322 string, THE Email SHALL throw a domain exception
2. WHEN an Email value object is constructed with a valid string, THE Email SHALL preserve the original value exactly
3. WHEN a UserId is generated, THE UserId SHALL produce a value in UUID v4 format
4. WHEN a User entity is created via `User.create()`, THE User SHALL have `createdAt` equal to `updatedAt`
5. WHEN a User entity's `updateName` or `updateEmail` method is called, THE User SHALL update `updatedAt` to reflect the modification time

### Requirement 7: Persistência com Cassandra

**User Story:** As a developer, I want the Cassandra repository to correctly persist and retrieve User entities, so that data is durable and consistent.

#### Acceptance Criteria

1. WHEN a User is saved via `UserRepository.save()`, THE UserRepository SHALL insert a row in the `users` table and a row in the `users_by_email` table
2. WHEN `UserRepository.findById()` is called with an existing UserId, THE UserRepository SHALL return the corresponding User entity with all fields populated
3. WHEN `UserRepository.findById()` is called with a non-existent UserId, THE UserRepository SHALL return `null`
4. WHEN `UserRepository.findByEmail()` is called with an existing Email, THE UserRepository SHALL return the corresponding User entity
5. WHEN `UserRepository.findByEmail()` is called with a non-existent Email, THE UserRepository SHALL return `null`
6. WHEN a User is mapped from a Cassandra row via `UserCassandraMapper.toDomain()` and then mapped back via `toPersistence()`, THE Mapper SHALL produce a record equivalent to the original row
7. WHEN a Cassandra connection error occurs during any repository operation, THE System SHALL propagate the error resulting in HTTP 500 with `{ "message": "Internal server error" }`

### Requirement 8: Segurança e Exposição de Dados

**User Story:** As a security engineer, I want sensitive user data to be protected, so that passwords and internal fields are never exposed.

#### Acceptance Criteria

1. THE System SHALL never include `passwordHash` in any HTTP response body
2. WHEN a User is created or updated, THE System SHALL never store a plain text password in any persistence layer
3. WHEN bcrypt hashing is applied, THE System SHALL use a minimum of 10 salt rounds
