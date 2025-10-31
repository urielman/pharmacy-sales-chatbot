import { Migration } from '@mikro-orm/migrations';

export class Migration20251031192757_init extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "conversation" ("id" serial primary key, "phone_number" varchar(255) not null, "status" text check ("status" in ('ACTIVE', 'COMPLETED', 'FOLLOWUP_SCHEDULED')) not null default 'ACTIVE', "state" text check ("state" in ('INITIAL_GREETING', 'PHARMACY_IDENTIFIED', 'COLLECTING_LEAD_INFO', 'DISCUSSING_SERVICES', 'SCHEDULING_FOLLOWUP', 'COMPLETED')) not null default 'INITIAL_GREETING', "pharmacy_id" varchar(255) null, "is_returning_pharmacy" boolean not null default false, "pharmacy_data" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);

    this.addSql(`create table "message" ("id" serial primary key, "conversation_id" int not null, "role" text check ("role" in ('USER', 'ASSISTANT', 'SYSTEM')) not null, "content" text not null, "metadata" jsonb null, "timestamp" timestamptz not null);`);

    this.addSql(`create table "pharmacy_lead" ("id" serial primary key, "phone_number" varchar(255) not null, "pharmacy_name" varchar(255) null, "contact_person" varchar(255) null, "email" varchar(255) null, "estimated_rx_volume" int null, "notes" text null, "address" varchar(255) null, "city" varchar(255) null, "state" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "pharmacy_lead" add constraint "pharmacy_lead_phone_number_unique" unique ("phone_number");`);

    this.addSql(`alter table "message" add constraint "message_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "message" drop constraint "message_conversation_id_foreign";`);

    this.addSql(`drop table if exists "conversation" cascade;`);

    this.addSql(`drop table if exists "message" cascade;`);

    this.addSql(`drop table if exists "pharmacy_lead" cascade;`);
  }

}
