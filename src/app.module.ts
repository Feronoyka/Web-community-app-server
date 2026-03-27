import { TypeOrmModule } from '@nestjs/typeorm';
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
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        ...configService.get('database'),
        entities: [User, Community, Message, Conversation],
      }),
    }),
    UserModule,
    CommunityModule,
    ChatModule,
  ],
  providers: [
    {
      provide: TypedConfigService,
      useExisting: ConfigService,
    },
  ],
})
export class AppModule {}
