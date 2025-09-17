import { Module } from '@nestjs/common';
import { DrizzleModule } from '../db/drizzle.module';
import { AuditService } from './audit.service';

@Module({
  imports: [DrizzleModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
