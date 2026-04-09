import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CassandraModule } from 'src/shared/infrastructure/persistence/cassandra.module';
import { UserCassandraRepository } from '../user/infrastructure/persistence/user-cassandra.repository';
import { USER_REPOSITORY } from '../user/domain/tokens';
import { LOGIN_USE_CASE } from './domain/tokens';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { AuthController } from './infrastructure/http/auth.controller';

@Module({
  imports: [
    CassandraModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'changeme',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserCassandraRepository },
    { provide: LOGIN_USE_CASE, useClass: LoginUseCase },
    JwtStrategy,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
