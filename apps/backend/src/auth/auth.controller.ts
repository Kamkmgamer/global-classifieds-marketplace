import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RateLimit, RateLimitPresets } from '../common/decorators/rate-limit.decorator';
import { AdvancedRateLimitGuard } from '../common/guards/advanced-rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseGuards(AdvancedRateLimitGuard)
  @RateLimit(RateLimitPresets.AUTH_REGISTER)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdvancedRateLimitGuard, LocalAuthGuard)
  @RateLimit(RateLimitPresets.AUTH_LOGIN)
  async login(
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const deviceInfo = userAgent || 'Unknown Device';
    return this.authService.login(req.user, deviceInfo, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdvancedRateLimitGuard)
  @RateLimit(RateLimitPresets.API_GENERAL)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const deviceInfo = userAgent || refreshTokenDto.deviceInfo || 'Unknown Device';
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken, deviceInfo, ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Request() req) {
    await this.authService.logoutAllDevices(req.user.sub);
    return { message: 'Logged out from all devices' };
  }
}
