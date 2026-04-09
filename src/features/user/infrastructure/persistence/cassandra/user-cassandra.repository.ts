import { Inject, Injectable } from '@nestjs/common';
import { Client } from 'cassandra-driver';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository, PageResult } from '../../../domain/ports/outbound/user-repository.port';
import { Email } from '../../../domain/value-objects/email.vo';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { UserCassandraMapper } from '../mappers/user-cassandra.mapper';
import { CASSANDRA_CLIENT } from './cassandra.provider';

@Injectable()
export class UserCassandraRepository implements IUserRepository {
  constructor(@Inject(CASSANDRA_CLIENT) private readonly client: Client) {}

  async save(user: User): Promise<void> {
    const data = UserCassandraMapper.toPersistence(user);

    await this.client.execute(
      `INSERT INTO app.users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.id, data.name, data.email, data.password_hash, data.created_at, data.updated_at],
      { prepare: true },
    );

    await this.client.execute(
      `INSERT INTO app.users_by_email (email, id) VALUES (?, ?)`,
      [data.email, data.id],
      { prepare: true },
    );
  }

  async findById(id: UserId): Promise<User | null> {
    const result = await this.client.execute(
      `SELECT * FROM app.users WHERE id = ?`,
      [id.value],
      { prepare: true },
    );

    if (result.rowLength === 0) return null;

    return UserCassandraMapper.toDomain(result.first());
  }

  async findByEmail(email: Email): Promise<User | null> {
    const emailResult = await this.client.execute(
      `SELECT id FROM app.users_by_email WHERE email = ?`,
      [email.value],
      { prepare: true },
    );

    if (emailResult.rowLength === 0) return null;

    const id = emailResult.first().id as string;

    const userResult = await this.client.execute(
      `SELECT * FROM app.users WHERE id = ?`,
      [id.toString()],
      { prepare: true },
    );

    if (userResult.rowLength === 0) return null;

    return UserCassandraMapper.toDomain(userResult.first());
  }

  async findAll(pageSize: number, pageState?: string): Promise<PageResult<User>> {
    const options: Record<string, unknown> = { prepare: true, fetchSize: pageSize };
    if (pageState) {
      options.pageState = pageState;
    }

    const result = await this.client.execute(`SELECT * FROM app.users`, [], options);

    return {
      data: result.rows.map((row) => UserCassandraMapper.toDomain(row)),
      nextPageState: result.pageState ? result.pageState.toString() : null,
    };
  }

  async update(user: User): Promise<void> {
    const data = UserCassandraMapper.toPersistence(user);

    // Fetch current email to detect changes
    const current = await this.findById(user.id);

    await this.client.execute(
      `UPDATE app.users SET name = ?, email = ?, password_hash = ?, updated_at = ? WHERE id = ?`,
      [data.name, data.email, data.password_hash, data.updated_at, data.id],
      { prepare: true },
    );

    if (current && current.email.value !== user.email.value) {
      await this.client.execute(
        `DELETE FROM app.users_by_email WHERE email = ?`,
        [current.email.value],
        { prepare: true },
      );

      await this.client.execute(
        `INSERT INTO app.users_by_email (email, id) VALUES (?, ?)`,
        [data.email, data.id],
        { prepare: true },
      );
    }
  }

  async delete(id: UserId): Promise<void> {
    const user = await this.findById(id);

    await this.client.execute(
      `DELETE FROM app.users WHERE id = ?`,
      [id.value],
      { prepare: true },
    );

    if (user) {
      await this.client.execute(
        `DELETE FROM app.users_by_email WHERE email = ?`,
        [user.email.value],
        { prepare: true },
      );
    }
  }
}
