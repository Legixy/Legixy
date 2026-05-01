import { Controller, Post, Get, Body, UseGuards, HttpCode, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { Public } from './public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from './jwt.strategy';
import { GoogleProfile } from './google.strategy';

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

  /**
   * POST /api/v1/auth/forgot-password
   * Sends a password reset link. Always returns 200 (no user enumeration).
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * POST /api/v1/auth/reset-password
   * Validates token and sets a new password.
   */
  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  /**
   * GET /api/v1/auth/google
   * Redirects the browser to Google's OAuth consent screen.
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Guard handles the redirect; this body never executes
  }

  /**
   * GET /api/v1/auth/google/callback
   * Google redirects here after consent. Issues JWT and redirects to frontend.
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfile;
    const result  = await this.authService.googleLogin(profile);

    // Redirect to Next.js server route which will set the HttpOnly cookie
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return res.redirect(
      `${appUrl}/api/auth/google-callback?token=${encodeURIComponent(result.access_token)}`,
    );
  }
}
