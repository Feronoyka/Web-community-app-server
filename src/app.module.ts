import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthController } from './user/auth/auth.controller';

@Module({
  imports: [UserModule],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}
