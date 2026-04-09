import { types } from 'cassandra-driver';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { UserId } from '../../../domain/value-objects/user-id.vo';

export class UserCassandraMapper {
  static toDomain(row: types.Row): User {
    return User.reconstitute({
      id: new UserId(row.id.toString()),
      name: row.name as string,
      email: new Email(row.email as string),
      passwordHash: row.password_hash as string,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    });
  }

  static toPersistence(user: User): Record<string, unknown> {
    return {
      id: user.id.value,
      name: user.name,
      email: user.email.value,
      password_hash: user.passwordHash,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }
}
