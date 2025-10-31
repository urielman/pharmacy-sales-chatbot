import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { StartChatDto } from './dto/start-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ScheduleCallbackDto } from './dto/schedule-callback.dto';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('api/chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('start')
  async startChat(@Body() dto: StartChatDto) {
    return this.chatbotService.startChat(dto.phoneNumber);
  }

  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatbotService.sendMessage(dto.conversationId, dto.message);
  }

  @Post('schedule-callback')
  async scheduleCallback(@Body() dto: ScheduleCallbackDto) {
    return this.chatbotService.scheduleCallback(
      dto.conversationId,
      dto.preferredTime,
      dto.notes,
    );
  }

  @Post('send-email')
  async sendEmail(@Body() dto: SendEmailDto) {
    return this.chatbotService.sendEmail(
      dto.conversationId,
      dto.email,
      dto.includePricing,
    );
  }

  @Get('conversation/:id')
  async getConversation(@Param('id', ParseIntPipe) id: number) {
    return this.chatbotService.getConversation(id);
  }
}
