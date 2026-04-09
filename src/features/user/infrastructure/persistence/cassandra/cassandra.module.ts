import { Global, Module } from '@nestjs/common';
import { CassandraProvider, CASSANDRA_CLIENT } from './cassandra.provider';

@Global()
@Module({
  providers: [CassandraProvider],
  exports: [CASSANDRA_CLIENT],
})
export class CassandraModule {}
