import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';

// Load env vars when running CLI directly
loadEnv();

const NODE_ENV = process.env.NODE_ENV || 'development';

// Helper to coerce env with default
function env<T = string>(key: string, fallback?: T): T {
  return (process.env[key] as unknown as T) ?? (fallback as T);
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env('DATABASE_HOST', 'db'),
  port: Number(env('DATABASE_PORT', 5432)),
  username: env('POSTGRES_USER', 'user'),
  password: env('POSTGRES_PASSWORD', 'password'),
  database: env('POSTGRES_DB', 'classifieds_db'),
  // Use compiled JS in dist for production, TS in src for dev/CLI
  entities: [
    NODE_ENV === 'production'
      ? join(__dirname, 'dist/**/*.entity.js')
      : join(__dirname, 'src/**/*.entity.ts'),
  ],
  migrations: [
    NODE_ENV === 'production'
      ? join(__dirname, 'dist/migrations/*.js')
      : join(__dirname, 'src/migrations/*.ts'),
  ],
  synchronize: false, // Always false for CLI; manage schema via migrations
  logging: false,
});

export default AppDataSource;
