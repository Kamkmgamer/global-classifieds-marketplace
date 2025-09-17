import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type Drizzle = ReturnType<typeof drizzle<typeof schema>>;

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DRIZZLE',
      useFactory: async (configService: ConfigService) => {
        const client = new Pool({
          connectionString: configService.get('DATABASE_URL'),
        });
        return drizzle(client, { schema });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DRIZZLE'],
})
export class DrizzleModule {}