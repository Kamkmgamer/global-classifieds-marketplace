import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

export interface AuditLogData {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  resourceId?: string;
  resourceType?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
  sessionId?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        ...data,
        success: data.success ?? true,
        createdAt: new Date(),
      });
      
      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Audit logging should never break the main application flow
      console.error('Failed to write audit log:', error);
    }
  }

  async logUserLogin(userId: string, userEmail: string, ipAddress?: string, userAgent?: string, sessionId?: string): Promise<void> {
    await this.log({
      action: AuditAction.USER_LOGIN,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      sessionId,
      details: { timestamp: new Date().toISOString() },
    });
  }

  async logUserLogout(userId: string, userEmail: string, ipAddress?: string, userAgent?: string, sessionId?: string): Promise<void> {
    await this.log({
      action: AuditAction.USER_LOGOUT,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      sessionId,
      details: { timestamp: new Date().toISOString() },
    });
  }

  async logFailedLogin(email: string, ipAddress?: string, userAgent?: string, errorMessage?: string): Promise<void> {
    await this.log({
      action: AuditAction.FAILED_LOGIN,
      userEmail: email,
      ipAddress,
      userAgent,
      success: false,
      errorMessage,
      details: { 
        timestamp: new Date().toISOString(),
        attemptedEmail: email,
      },
    });
  }

  async logAccountLockout(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      action: AuditAction.ACCOUNT_LOCKOUT,
      userEmail: email,
      ipAddress,
      userAgent,
      details: { 
        timestamp: new Date().toISOString(),
        reason: 'Multiple failed login attempts',
      },
    });
  }

  async logPasswordChange(userId: string, userEmail: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      action: AuditAction.PASSWORD_CHANGE,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      details: { timestamp: new Date().toISOString() },
    });
  }

  async logTokenRefresh(userId: string, userEmail: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      action: AuditAction.TOKEN_REFRESH,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      details: { timestamp: new Date().toISOString() },
    });
  }

  async logSecurityEvent(
    event: string, 
    userId?: string, 
    userEmail?: string, 
    ipAddress?: string, 
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: AuditAction.SECURITY_EVENT,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      details: { 
        event,
        timestamp: new Date().toISOString(),
        ...details,
      },
    });
  }

  async getAuditLogs(
    filters: {
      userId?: string;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
      ipAddress?: string;
    } = {},
    limit = 100,
    offset = 0,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (filters.userId) {
      query.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.action) {
      query.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters.ipAddress) {
      query.andWhere('audit.ipAddress = :ipAddress', { ipAddress: filters.ipAddress });
    }

    return query
      .orderBy('audit.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }
}
