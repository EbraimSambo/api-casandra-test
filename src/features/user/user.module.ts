import { Module } from '@nestjs/common';
import { CassandraModule } from '../shared/infrastructure/persistence/cassandra.module';
import { UserController } from './infrastructure/http/user.controller';
import { UserCassandraRepository } from './infrastructure/persistence/user-cassandra.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { FindUserUseCase } from './application/use-cases/find-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import {
  USER_REPOSITORY,
  CREATE_USER_USE_CASE,
  FIND_USER_USE_CASE,
  LIST_USERS_USE_CASE,
  UPDATE_USER_USE_CASE,
  DELETE_USER_USE_CASE,
} from './domain/tokens';

@Module({
  imports: [CassandraModule],
  controllers: [UserController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserCassandraRepository },
    { provide: CREATE_USER_USE_CASE, useClass: CreateUserUseCase },
    { provide: FIND_USER_USE_CASE, useClass: FindUserUseCase },
    { provide: LIST_USERS_USE_CASE, useClass: ListUsersUseCase },
    { provide: UPDATE_USER_USE_CASE, useClass: UpdateUserUseCase },
    { provide: DELETE_USER_USE_CASE, useClass: DeleteUserUseCase },
  ],
})
export class UserModule {}
