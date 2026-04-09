import { Injectable, Inject } from '@nestjs/common';
import { IListUsersUseCase } from '../../domain/ports/inbound/user-use-cases.port';
import type { IUserRepository, PageResult } from '../../domain/ports/outbound/user-repository.port';
import { USER_REPOSITORY } from '../../domain/tokens';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class ListUsersUseCase implements IListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(pageSize: number, pageState?: string): Promise<PageResult<User>> {
    return this.repository.findAll(pageSize, pageState);
  }
}
