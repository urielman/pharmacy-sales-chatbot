import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class PharmacyLead {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  phoneNumber!: string;

  @Property({ nullable: true })
  pharmacyName?: string;

  @Property({ nullable: true })
  contactPerson?: string;

  @Property({ nullable: true })
  email?: string;

  @Property({ nullable: true })
  estimatedRxVolume?: number;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ nullable: true })
  address?: string;

  @Property({ nullable: true })
  city?: string;

  @Property({ nullable: true })
  state?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
