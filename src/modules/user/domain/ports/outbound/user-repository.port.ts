import { User } from '../../entities/user.entity';
import { UserId } from '../../value-objects/user-id.vo';
import { Email } from '../../value-objects/email.vo';

export abstract class IUserRepository {
 abstract save(user: User): Promise<void>;
 abstract findById(id: UserId): Promise<User | null>;
 abstract findByEmail(email: Email): Promise<User | null>;
 abstract findAll(): Promise<User[]>;
 abstract update(user: User): Promise<void>;
 abstract delete(id: UserId): Promise<void>;
}
