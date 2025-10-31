import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import config from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MikroOrmModule.forRoot(config),
    ChatbotModule,
    PharmacyModule,
    AiModule,
    NotificationsModule,
  ],
})
export class AppModule {}
