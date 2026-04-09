import { Injectable, Inject } from '@nestjs/common';
import { IUpdateUserUseCase } from '../../domain/ports/inbound/user-use-cases.port';
import type { IUserRepository } from '../../domain/ports/outbound/user-repository.port';
import { USER_REPOSITORY } from '../../domain/tokens';
import { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { EmailConflictException } from '../../domain/exceptions/email-conflict.exception';

@Injectable()
export class UpdateUserUseCase implements IUpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(id: string, dto: { name?: string; email?: string }): Promise<User> {
    const user = await this.repository.findById(new UserId(id));
    if (!user) {
      throw new UserNotFoundException(id);
    }

    if (dto.email !== undefined) {
      const email = new Email(dto.email);
      const existing = await this.repository.findByEmail(email);
      if (existing && !existing.id.equals(user.id)) {
        throw new EmailConflictException(dto.email);
      }
      user.updateEmail(email);
    }

    if (dto.name !== undefined) {
      user.updateName(dto.name);
    }

    await this.repository.update(user);
    return user;
  }
}
