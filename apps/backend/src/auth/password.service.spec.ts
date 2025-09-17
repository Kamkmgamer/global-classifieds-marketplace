import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

jest.mock('argon2');
jest.mock('bcrypt');

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash password with argon2', async () => {
      const mockHash = jest.fn().mockResolvedValue('hashed');
      (require('argon2').hash as jest.Mock) = mockHash;

      const result = await service.hashPassword('password');

      expect(mockHash).toHaveBeenCalledWith('password', expect.any(Object));
      expect(result).toBe('hashed');
    });
  });

  describe('verifyPassword', () => {
    it('should verify argon2 hash', async () => {
      const mockVerify = jest.fn().mockResolvedValue(true);
      (require('argon2').verify as jest.Mock) = mockVerify;

      const result = await service.verifyPassword('password', '$argon2...');

      expect(mockVerify).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should verify bcrypt hash', async () => {
      const mockCompare = jest.fn().mockResolvedValue(true);
      (require('bcrypt').compare as jest.Mock) = mockCompare;

      const result = await service.verifyPassword('password', '$2b$...');

      expect(mockCompare).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  // Add more tests
});