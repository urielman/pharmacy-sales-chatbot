import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class ScheduleCallbackDto {
  @IsNumber()
  @IsNotEmpty()
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  preferredTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
