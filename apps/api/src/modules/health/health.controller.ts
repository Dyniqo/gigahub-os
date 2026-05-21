import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@app/common';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
    private readonly prismaService: PrismaService,
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
      () => this.checkDatabase(),
    ]);
  }

  private async checkDatabase(): Promise<{ database: { status: 'up' } }> {
    try {
      await this.prismaService.checkConnection();

      return {
        database: {
          status: 'up',
        },
      };
    } catch {
      throw new HealthCheckError('Database check failed', {
        database: {
          status: 'down',
        },
      });
    }
  }
}
