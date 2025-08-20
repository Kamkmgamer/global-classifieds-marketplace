import { IsString, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}

export class TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
