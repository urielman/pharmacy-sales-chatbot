import { Entity, PrimaryKey, Property, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { Message } from './message.entity';

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FOLLOWUP_SCHEDULED = 'FOLLOWUP_SCHEDULED',
}

export enum ConversationState {
  INITIAL_GREETING = 'INITIAL_GREETING',
  PHARMACY_IDENTIFIED = 'PHARMACY_IDENTIFIED',
  COLLECTING_LEAD_INFO = 'COLLECTING_LEAD_INFO',
  DISCUSSING_SERVICES = 'DISCUSSING_SERVICES',
  SCHEDULING_FOLLOWUP = 'SCHEDULING_FOLLOWUP',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Conversation {
  @PrimaryKey()
  id!: number;

  @Property()
  phoneNumber!: string;

  @Enum(() => ConversationStatus)
  status: ConversationStatus = ConversationStatus.ACTIVE;

  @Enum(() => ConversationState)
  state: ConversationState = ConversationState.INITIAL_GREETING;

  @Property({ nullable: true })
  pharmacyId?: string;

  @Property()
  isReturningPharmacy: boolean = false;

  @Property({ type: 'json', nullable: true })
  pharmacyData?: any;

  @OneToMany(() => Message, (message) => message.conversation)
  messages = new Collection<Message>(this);

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
