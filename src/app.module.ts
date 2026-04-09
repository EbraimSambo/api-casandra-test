import { Module } from '@nestjs/common';
import { UserModule } from './features/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
