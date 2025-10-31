import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { Conversation } from './conversation.entity';

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

@Entity()
export class Message {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Conversation)
  conversation!: Conversation;

  @Enum(() => MessageRole)
  role!: MessageRole;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Property()
  timestamp: Date = new Date();
}
