import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { HealthService } from './health.service';

/**
 * Two endpoints, split on who is allowed to know what.
 *
 * Slice 8 kept delivery status off the public health route, correctly: an
 * anonymous caller learning "no notifications are being sent" has learned
 * something operationally useful about a system they do not own.
 *
 * The cost was that nobody could learn it, including the person about to
 * demo the product. So the split is by audience rather than by suppression.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /**
   * GET /api/v1/health — public liveness.
   *
   * Returns `{ status: 'ok' }` and nothing else. No version, no region, no
   * dependency state, no configuration. A load balancer needs a 200; it does
   * not need to know what this process is or what it is missing.
   */
  @Public()
  @Get()
  liveness() {
    return this.health.liveness();
  }

  /**
   * GET /api/v1/health/ready — authenticated readiness.
   *
   * Any signed-in user of any tenant can read this. It reveals the
   * deployment's own state — database, migrations, scheduler, delivery
   * channel, encryption key — and never any tenant's data, so there is
   * nothing here that leaks across a tenant boundary.
   */
  @Get('ready')
  readiness() {
    return this.health.readiness();
  }
}
