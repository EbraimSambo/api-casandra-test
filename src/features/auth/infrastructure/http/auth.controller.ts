import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UnauthorizedException } from '@nestjs/common';
import { ILoginUseCase } from '../../domain/ports/inbound/auth-use-cases.port';
import { LOGIN_USE_CASE } from '../../domain/tokens';
import { LoginDto } from './dto/login.dto';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(LOGIN_USE_CASE)
    private readonly loginUseCase: ILoginUseCase,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    try {
      return await this.loginUseCase.execute(dto);
    } catch (err) {
      if (err instanceof InvalidCredentialsException) {
        throw new UnauthorizedException(err.message);
      }
      throw err;
    }
  }
}
