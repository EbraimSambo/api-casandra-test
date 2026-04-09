// RFC 5322 simplified regex — covers the vast majority of valid email addresses
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || !EMAIL_REGEX.test(value)) {
      throw new Error(`Invalid email address: "${value}"`);
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}
