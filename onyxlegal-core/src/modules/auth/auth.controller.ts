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
import { googleSignInConfigured } from '../../config/environment';

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
   * GET /api/v1/auth/providers — which sign-in methods actually work.
   *
   * THE FIFTH DEAD AFFORDANCE
   * -------------------------
   * The login screen has offered "Continue with Google" since Slice 1.
   * GoogleStrategy falls back to the literal string
   * 'GOOGLE_CLIENT_ID_NOT_SET' when the variable is absent, so clicking it
   * sent the user to Google's OAuth endpoint with an invalid client and an
   * error page came back. GOOGLE_CLIENT_ID has never been configured.
   *
   * That is the same class this project has now fixed five times: an
   * interface offering something the system cannot do. The button is not
   * removed — Google sign-in is a real feature the moment credentials exist —
   * it is hidden until it works.
   *
   * Public, and deliberately so: it reveals only which sign-in methods a
   * login page is about to render, which the login page reveals anyway.
   */
  @Public()
  @Get('providers')
  providers() {
    return {
      password: true,
      google: googleSignInConfigured(),
    };
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
