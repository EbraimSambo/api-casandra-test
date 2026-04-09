import { v4 as uuidv4, validate, version } from 'uuid';

export class UserId {
  private readonly _value: string;

  constructor(value: string) {
    if (!validate(value) || version(value) !== 4) {
      throw new Error(`Invalid UUID v4: "${value}"`);
    }
    this._value = value;
  }

  static generate(): UserId {
    return new UserId(uuidv4());
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }
}
