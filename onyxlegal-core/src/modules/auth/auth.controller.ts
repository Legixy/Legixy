import { Controller, Post, Get, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Email + password login. Returns JWT access token.
   */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /**
   * POST /api/v1/auth/register
   * Self-service registration — creates tenant + owner user.
   */
  @Public()
  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/v1/auth/signup
   * Supabase-backed signup (legacy). Creates tenant + owner via supabaseId.
   */
  @Public()
  @Post('signup')
  @HttpCode(201)
  async signup(@Body() dto: SignupDto) {
    const result = await this.authService.signup(dto);
    return {
      user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role },
      tenant: { id: result.tenant.id, name: result.tenant.name, plan: result.tenant.plan },
      isNew: result.isNew,
    };
  }

  /**
   * GET /api/v1/auth/me
   * Current user profile + tenant. Requires valid JWT.
   */
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.authService.getProfile(user.id);
    return { user: profile };
  }
}
