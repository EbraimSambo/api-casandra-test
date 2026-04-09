import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ICreateUserUseCase } from '../../domain/ports/inbound/user-use-cases.port';
import { USER_REPOSITORY } from '../../domain/tokens';
import { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { EmailConflictException } from '../../domain/exceptions/email-conflict.exception';
import { IUserRepository } from '../../domain/ports/outbound/user-repository.port';

@Injectable()
export class CreateUserUseCase implements ICreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(dto: { name: string; email: string; password: string }): Promise<User> {
    const email = new Email(dto.email);

    const existing = await this.repository.findByEmail(email);
    if (existing) {
      throw new EmailConflictException(dto.email);
    }

    const id = UserId.generate();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = User.create({ id, name: dto.name, email, passwordHash });

    await this.repository.save(user);

    return user;
  }
}
