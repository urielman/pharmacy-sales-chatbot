import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Conversation } from './database/entities/conversation.entity';
import { Message } from './database/entities/message.entity';
import { PharmacyLead } from './database/entities/pharmacy-lead.entity';

const config: Options = {
  driver: PostgreSqlDriver,
  entities: [Conversation, Message, PharmacyLead],
  dbName: process.env.DATABASE_NAME || 'pharmacy_chatbot',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER || 'pharmacy_user',
  password: process.env.DATABASE_PASSWORD || 'pharmacy_pass',
  migrations: {
    path: './dist/database/migrations',
    pathTs: './src/database/migrations',
  },
  debug: process.env.NODE_ENV !== 'production',
};

export default config;
