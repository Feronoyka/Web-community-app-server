import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat-gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthConfig } from '../config/auth.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const authConfig = configService.get<AuthConfig>('auth');
        return {
          secret: authConfig?.jwt.accessToken.secret,
          signOptions: {
            expiresIn: parseInt(
              authConfig?.jwt.accessToken.expiresIn as string,
            ),
          },
        };
      },
    }),
  ],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
