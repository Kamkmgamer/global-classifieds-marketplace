import { Injectable, Inject } from '@nestjs/common';
import { auditLogs } from '../db/schema';
import type { Drizzle } from '../db/drizzle.module';
import { desc } from 'drizzle-orm';

export enum AuditAction {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  PASSWORD_CHANGE = 'password_change',
  TOKEN_REFRESH = 'token_refresh',
  ACCOUNT_LOCKOUT = 'account_lockout',
  FAILED_LOGIN = 'failed_login',
  LISTING_CREATE = 'listing_create',
  LISTING_UPDATE = 'listing_update',
  LISTING_DELETE = 'listing_delete',
  ADMIN_ACTION = 'admin_action',
  SECURITY_EVENT = 'security_event',
}

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
    @Inject('DRIZZLE') private db: Drizzle,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({
        ...data,
        success: data.success ?? true,
      });
    } catch (error) {
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

  async getRecentLogs(
    limit = 100,
    offset = 0,
  ): Promise<any[]> {
    return this.db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
  }
}
