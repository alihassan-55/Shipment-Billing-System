export class Entity {
  constructor(id) {
    this._id = id;
  }

  get id() {
    return this._id;
  }

  equals(entity) {
    if (!(entity instanceof Entity)) return false;
    return this._id === entity._id;
  }
}

export class AggregateRoot extends Entity {
  constructor(id) {
    super(id);
    this._domainEvents = [];
  }

  addDomainEvent(event) {
    this._domainEvents.push(event);
  }

  clearDomainEvents() {
    this._domainEvents = [];
  }

  get domainEvents() {
    return [...this._domainEvents];
  }
}