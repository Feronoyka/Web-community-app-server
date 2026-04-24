import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { authConfig } from './config/auth.config';
import { User } from './user/user.entity';
import { TypedConfigService } from './config/typed-config.service';
import { CommunityModule } from './community/community.module';
import { Community } from './community/community.entity';
import { typeOrmConfig } from './config/database.config';
import { appSchemaConfig } from './config/app-schema.config';
import { Message } from './chat/entities/message.entity';
import { ChatModule } from './chat/chat.module';
import { Conversation } from './chat/entities/conversation.entity';
import { MailModule } from './user/services/mail/mail.module';
import { OtpModule } from './user/services/otp/otp.module';
import { Otp } from './user/services/otp/otp.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
      load: [authConfig, typeOrmConfig],
      validationSchema: appSchemaConfig,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: TypedConfigService) => ({
        ...configService.get<TypeOrmModuleOptions>('database'),
        entities: [User, Community, Message, Conversation, Otp],
      }),
    }),
    UserModule,
    CommunityModule,
    ChatModule,
    MailModule,
    OtpModule,
  ],
  providers: [
    {
      provide: TypedConfigService,
      useExisting: ConfigService,
    },
  ],
})
export class AppModule {}
