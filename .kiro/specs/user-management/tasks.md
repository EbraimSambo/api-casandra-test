# Implementation Plan: User Management

## Overview

Implementação incremental do módulo de gerenciamento de usuários em NestJS 11 com arquitetura hexagonal e Cassandra. Cada tarefa constrói sobre a anterior, começando pelo domínio isolado e terminando com a integração completa via HTTP.

## Tasks

- [x] 1. Configurar dependências e estrutura do módulo
  - Instalar `uuid`, `bcrypt`, `@types/bcrypt`, `class-validator`, `class-transformer`, `@nestjs/mapped-types`, `fast-check`
  - Criar a estrutura de pastas em `src/modules/user/` conforme o design
  - Criar `src/modules/user/user.module.ts` com esqueleto inicial
  - Registrar `UserModule` em `src/app.module.ts`
  - _Requirements: 1.1, 7.1_

- [x] 2. Implementar camada de domínio
  - [x] 2.1 Implementar value objects `UserId` e `Email`
    - Criar `src/modules/user/domain/value-objects/user-id.vo.ts` com `generate()`, `equals()` e validação UUID v4
    - Criar `src/modules/user/domain/value-objects/email.vo.ts` com validação RFC 5322 e lançamento de exceção de domínio em input inválido
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 2.2 Escrever property tests para `UserId` e `Email`
    - **Property 1: Email value object preserves valid input**
    - **Validates: Requirements 6.2**
    - **Property 2: Email value object rejects invalid input**
    - **Validates: Requirements 6.1**
    - **Property 3: UserId generation produces unique UUID v4 values**
    - **Validates: Requirements 1.2, 6.3**

  - [x] 2.3 Implementar `User` entity
    - Criar `src/modules/user/domain/entities/user.entity.ts` com `User.create()`, `User.reconstitute()`, `updateName()`, `updateEmail()`
    - Garantir que `createdAt === updatedAt` em `create()` e que `updateName`/`updateEmail` avançam `updatedAt`
    - _Requirements: 6.4, 6.5_

  - [ ]* 2.4 Escrever property tests para `User` entity
    - **Property 4: User creation invariant — createdAt equals updatedAt**
    - **Validates: Requirements 1.4, 6.4**
    - **Property 5: User update advances updatedAt**
    - **Validates: Requirements 4.2, 6.5**
    - **Property 6: Partial update preserves unspecified fields**
    - **Validates: Requirements 4.3**

  - [x] 2.5 Implementar exceções de domínio e ports
    - Criar `src/modules/user/domain/exceptions/user-not-found.exception.ts`
    - Criar `src/modules/user/domain/exceptions/email-conflict.exception.ts`
    - Criar `src/modules/user/domain/ports/inbound/user-use-cases.port.ts` com interfaces `ICreateUserUseCase`, `IFindUserUseCase`, `IListUsersUseCase`, `IUpdateUserUseCase`, `IDeleteUserUseCase`
    - Criar `src/modules/user/domain/ports/outbound/user-repository.port.ts` com interface `IUserRepository`
    - Criar `src/modules/user/domain/tokens.ts` com os símbolos de injeção (`USER_REPOSITORY`, `CREATE_USER_USE_CASE`, etc.)
    - _Requirements: 2.2, 4.4, 5.2_

- [x] 3. Implementar use cases da camada de aplicação
  - [x] 3.1 Implementar `CreateUserUseCase`
    - Criar `src/modules/user/application/use-cases/create-user.use-case.ts`
    - Verificar email duplicado via `repository.findByEmail()`, lançar `EmailConflictException` se existir
    - Gerar `UserId`, fazer hash bcrypt com 10 salt rounds, chamar `User.create()` e `repository.save()`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.9_

  - [ ]* 3.2 Escrever unit tests para `CreateUserUseCase`
    - Testar criação com sucesso, conflito de email e inputs inválidos com repositório mockado
    - _Requirements: 1.1, 1.5_

  - [x] 3.3 Implementar `FindUserUseCase`
    - Criar `src/modules/user/application/use-cases/find-user.use-case.ts`
    - Chamar `repository.findById()`, lançar `UserNotFoundException` se retornar `null`
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Implementar `ListUsersUseCase`
    - Criar `src/modules/user/application/use-cases/list-users.use-case.ts`
    - Chamar `repository.findAll()` e retornar o array (vazio ou populado)
    - _Requirements: 3.1, 3.2_

  - [x] 3.5 Implementar `UpdateUserUseCase`
    - Criar `src/modules/user/application/use-cases/update-user.use-case.ts`
    - Buscar usuário, verificar conflito de email para outro usuário, aplicar `updateName`/`updateEmail`, chamar `repository.update()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.6 Implementar `DeleteUserUseCase`
    - Criar `src/modules/user/application/use-cases/delete-user.use-case.ts`
    - Buscar usuário, lançar `UserNotFoundException` se não existir, chamar `repository.delete()`
    - _Requirements: 5.1, 5.2_

  - [ ]* 3.7 Escrever unit tests para `FindUserUseCase`, `UpdateUserUseCase` e `DeleteUserUseCase`
    - Testar fluxos de sucesso e not-found com repositório mockado
    - _Requirements: 2.2, 4.4, 5.2_

- [ ] 4. Checkpoint — Garantir que todos os testes de domínio e use cases passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 5. Implementar infraestrutura de persistência Cassandra
  - [x] 5.1 Criar `CassandraModule` e provider do client
    - Criar `src/modules/user/infrastructure/persistence/cassandra/cassandra.module.ts`
    - Criar `src/modules/user/infrastructure/persistence/cassandra/cassandra.provider.ts` com factory que instancia `cassandra-driver` `Client` e executa o schema DDL (keyspace + tabelas `users` e `users_by_email`)
    - _Requirements: 7.1, 7.7_

  - [x] 5.2 Implementar `UserCassandraMapper`
    - Criar `src/modules/user/infrastructure/persistence/mappers/user-cassandra.mapper.ts` com `toDomain(row)` e `toPersistence(user)`
    - _Requirements: 7.6_

  - [ ]* 5.3 Escrever property test para o mapper
    - **Property 7: Mapper round-trip**
    - **Validates: Requirements 7.6**

  - [x] 5.4 Implementar `UserCassandraRepository`
    - Criar `src/modules/user/infrastructure/persistence/cassandra/user-cassandra.repository.ts` implementando `IUserRepository`
    - Usar prepared statements para `save`, `findById`, `findByEmail`, `findAll`, `update`, `delete`
    - `save` deve inserir em `users` e `users_by_email`; `delete` deve remover de ambas as tabelas
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_

  - [ ]* 5.5 Escrever property tests para `UserCassandraRepository` (requer Cassandra via Docker)
    - **Property 8: Persistence round-trip by ID**
    - **Validates: Requirements 7.1, 7.2**
    - **Property 9: Persistence round-trip by email**
    - **Validates: Requirements 7.1, 7.4**
    - **Property 13: Delete removes user from all lookups**
    - **Validates: Requirements 5.1**

- [x] 6. Implementar camada HTTP (controller e DTOs)
  - [x] 6.1 Criar DTOs com validação
    - Criar `src/modules/user/infrastructure/http/dto/create-user.dto.ts` com `class-validator` decorators para `name`, `email`, `password`
    - Criar `src/modules/user/infrastructure/http/dto/update-user.dto.ts` usando `PartialType(CreateUserDto)` sem o campo `password`
    - Criar `src/modules/user/infrastructure/http/dto/user-response.dto.ts` com `id`, `name`, `email`, `createdAt` (sem `passwordHash`)
    - _Requirements: 1.6, 1.7, 1.8, 2.3, 3.3, 4.6, 4.7, 8.1_

  - [ ]* 6.2 Escrever property test para ausência de passwordHash nas respostas
    - **Property 11: passwordHash is never exposed in HTTP responses**
    - **Validates: Requirements 2.3, 3.3, 8.1**

  - [x] 6.3 Implementar `UserController`
    - Criar `src/modules/user/infrastructure/http/user.controller.ts` com endpoints `POST /users`, `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`
    - Mapear exceções de domínio para respostas HTTP corretas (404, 409) usando `@nestjs/common` exceptions
    - Habilitar `ValidationPipe` globalmente em `src/main.ts`
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 4.1, 4.4, 4.5, 5.1, 5.2_

  - [ ]* 6.4 Escrever property test para rejeição de inputs inválidos
    - **Property 12: Invalid creation inputs are rejected**
    - **Validates: Requirements 1.6, 1.7, 1.8_

- [x] 7. Registrar providers e wiring final no `UserModule`
  - Atualizar `src/modules/user/user.module.ts` para registrar todos os use cases com seus tokens de injeção, `UserCassandraRepository` com `USER_REPOSITORY`, importar `CassandraModule`, e exportar o controller
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

  - [ ]* 7.1 Escrever property test de segurança para hash de senha
    - **Property 10: Password is never stored as plain text**
    - **Validates: Requirements 1.3, 8.2, 8.3**

- [ ] 8. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Os property tests usam `fast-check` conforme definido na estratégia de testes do design
- O schema Cassandra é criado automaticamente pelo provider na inicialização
- Prepared statements são obrigatórios em todas as queries do repositório
