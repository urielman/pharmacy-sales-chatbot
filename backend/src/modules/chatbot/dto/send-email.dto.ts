import { IsNumber, IsNotEmpty, IsEmail, IsBoolean, IsOptional } from 'class-validator';

export class SendEmailDto {
  @IsNumber()
  @IsNotEmpty()
  conversationId: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsBoolean()
  @IsOptional()
  includePricing?: boolean;
}
