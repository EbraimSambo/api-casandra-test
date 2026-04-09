import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ILoginUseCase, LoginResult } from '../../domain/ports/inbound/auth-use-cases.port';
import { IUserRepository } from 'src/features/user/domain/ports/outbound/user-repository.port';
import { USER_REPOSITORY } from 'src/features/user/domain/tokens';
import { Email } from 'src/features/user/domain/value-objects/email.vo';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';

@Injectable()
export class LoginUseCase implements ILoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: { email: string; password: string }): Promise<LoginResult> {
    const email = new Email(dto.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) throw new InvalidCredentialsException();

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new InvalidCredentialsException();

    const payload = { sub: user.id.value, email: user.email.value };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}
