import { UniqueEntityId } from './unique-entity-id';

export abstract class Entity<TProps extends Record<string, unknown>> {
  protected readonly props: TProps;
  private readonly entityId: UniqueEntityId;

  protected constructor(props: TProps, id?: UniqueEntityId) {
    this.props = props;
    this.entityId = id ?? new UniqueEntityId();
  }

  get id(): UniqueEntityId {
    return this.entityId;
  }

  equals(entity?: Entity<TProps>): boolean {
    if (entity === undefined || entity === null) {
      return false;
    }

    return this.id.equals(entity.id);
  }
}
