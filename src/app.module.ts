import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './features/user/user.module';
import { AuthModule } from './features/auth/auth.module';
import { JwtAuthGuard } from './features/auth/infrastructure/guards/jwt-auth.guard';

@Module({
  imports: [UserModule, AuthModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
