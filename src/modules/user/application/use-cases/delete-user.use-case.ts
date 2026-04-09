import { Injectable, Inject } from '@nestjs/common';
import { IDeleteUserUseCase } from '../../domain/ports/inbound/user-use-cases.port';
import type { IUserRepository } from '../../domain/ports/outbound/user-repository.port';
import { USER_REPOSITORY } from '../../domain/tokens';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';

@Injectable()
export class DeleteUserUseCase implements IDeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.repository.findById(new UserId(id));
    if (!user) {
      throw new UserNotFoundException(id);
    }
    await this.repository.delete(user.id);
  }
}
