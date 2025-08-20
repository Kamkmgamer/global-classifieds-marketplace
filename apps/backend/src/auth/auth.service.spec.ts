import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed'),
  compare: jest.fn(async (p: string, h: string) => p === 'password' && h === 'hashed')
}));

describe('AuthService', () => {
  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;
  const jwtService = {
    sign: jest.fn(() => 'jwt-token')
  } as unknown as jest.Mocked<JwtService>;
  const cache = {
    get: jest.fn(async () => undefined),
    set: jest.fn(async () => undefined),
    del: jest.fn(async () => undefined),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('register throws ConflictException when email exists (pre-check)', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue({ id: '1', email: 'e@e.com' });
    const svc = new AuthService(usersService as any, jwtService as any, cache as any);

    await expect(svc.register({ email: 'e@e.com', password: 'password' } as any)).rejects.toBeInstanceOf(ConflictException);
  });

  it('register catches DB unique constraint and throws ConflictException', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue(null);
    usersService.create = jest.fn().mockRejectedValue({ code: '23505' });

    const svc = new AuthService(usersService as any, jwtService as any, cache as any);
    await expect(svc.register({ email: 'new@e.com', password: 'password' } as any)).rejects.toBeInstanceOf(ConflictException);
  });

  it('register returns created user (without password) on success', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue(null);
    usersService.create = jest.fn().mockResolvedValue({ id: '2', email: 'new@e.com', password: 'hashed' });

    const svc = new AuthService(usersService as any, jwtService as any, cache as any);
    const res = await svc.register({ email: 'new@e.com', password: 'password' } as any);
    expect(res).toEqual({ id: '2', email: 'new@e.com' });
  });

  it('validateUser returns user without password when credentials match', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue({ id: '2', email: 'u@e.com', password: 'hashed' });
    const svc = new AuthService(usersService as any, jwtService as any, cache as any);

    const res = await svc.validateUser('u@e.com', 'password');
    expect(res).toEqual({ id: '2', email: 'u@e.com' });
  });

  it('validateUser returns null when credentials do not match', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue({ id: '2', email: 'u@e.com', password: 'hashed' });
    const svc = new AuthService(usersService as any, jwtService as any, cache as any);

    const res = await svc.validateUser('u@e.com', 'wrong');
    expect(res).toBeNull();
  });

  it('login returns a signed JWT', async () => {
    const svc = new AuthService(usersService as any, jwtService as any, cache as any);
    const res = await svc.login({ id: '2', email: 'u@e.com', role: 'user' });
    expect(jwtService.sign).toHaveBeenCalledWith({ email: 'u@e.com', sub: '2', role: 'user' });
    expect(res).toEqual({ access_token: 'jwt-token' });
  });
});
