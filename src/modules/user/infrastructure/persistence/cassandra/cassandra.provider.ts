import { Client } from 'cassandra-driver';

export const CASSANDRA_CLIENT = 'CASSANDRA_CLIENT';

export const CassandraProvider = {
  provide: CASSANDRA_CLIENT,
  useFactory: async (): Promise<Client> => {
    const client = new Client({
      contactPoints: ['localhost'],
      localDataCenter: 'datacenter1',
    });

    await client.connect();

    await client.execute(
      `CREATE KEYSPACE IF NOT EXISTS app WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`,
    );

    await client.execute(
      `CREATE TABLE IF NOT EXISTS app.users (id uuid, name text, email text, password_hash text, created_at timestamp, updated_at timestamp, PRIMARY KEY (id))`,
    );

    await client.execute(
      `CREATE TABLE IF NOT EXISTS app.users_by_email (email text, id uuid, PRIMARY KEY (email))`,
    );

    return client;
  },
};
