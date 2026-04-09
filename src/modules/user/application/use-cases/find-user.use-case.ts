import { Injectable, Inject } from '@nestjs/common';
import { IFindUserUseCase } from '../../domain/ports/inbound/user-use-cases.port';
import type { IUserRepository } from '../../domain/ports/outbound/user-repository.port';
import { USER_REPOSITORY } from '../../domain/tokens';
import { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';

@Injectable()
export class FindUserUseCase implements IFindUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(id: string): Promise<User> {
    const user = await this.repository.findById(new UserId(id));
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return user;
  }
}
