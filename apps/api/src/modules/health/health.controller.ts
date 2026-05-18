import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  @ApiOkResponse({
    description: 'Liveness check completed successfully.',
  })
  live(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.memoryHealthIndicator.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOkResponse({
    description: 'Readiness check completed successfully.',
  })
  ready(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.memoryHealthIndicator.checkRSS('memory_rss', 512 * 1024 * 1024),
    ]);
  }
}
