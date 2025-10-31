import { IsString, IsNotEmpty } from 'class-validator';

export class StartChatDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
