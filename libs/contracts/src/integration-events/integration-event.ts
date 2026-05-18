export interface IntegrationEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly id: string;
  readonly name: string;
  readonly version: number;
  readonly occurredAt: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly payload: TPayload;
}
