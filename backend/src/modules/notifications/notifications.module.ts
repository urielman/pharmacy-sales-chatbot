import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { CallbackService } from './callback.service';

@Module({
  providers: [EmailService, CallbackService],
  exports: [EmailService, CallbackService],
})
export class NotificationsModule {}
