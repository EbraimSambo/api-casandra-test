import { User } from '../../entities/user.entity';
import { UserId } from '../../value-objects/user-id.vo';
import { Email } from '../../value-objects/email.vo';

export interface PageResult<T> {
  data: T[];
  nextPageState: string | null;
}

export abstract class IUserRepository {
 abstract save(user: User): Promise<void>;
 abstract findById(id: UserId): Promise<User | null>;
 abstract findByEmail(email: Email): Promise<User | null>;
 abstract findAll(pageSize: number, pageState?: string): Promise<PageResult<User>>;
 abstract update(user: User): Promise<void>;
 abstract delete(id: UserId): Promise<void>;
}
