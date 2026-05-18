import type { DomainEvent } from './domain-event';
import { Entity } from './entity';

export abstract class AggregateRoot<TProps extends Record<string, unknown>> extends Entity<TProps> {
  private readonly domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    return this.domainEvents.splice(0, this.domainEvents.length);
  }
}
