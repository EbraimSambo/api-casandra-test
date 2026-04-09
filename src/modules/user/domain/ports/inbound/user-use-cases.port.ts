import { User } from '../../entities/user.entity';
import { PageResult } from '../outbound/user-repository.port';

export abstract class ICreateUserUseCase {
 abstract execute(dto: { name: string; email: string; password: string }): Promise<User>;
}

export abstract class IFindUserUseCase {
 abstract execute(id: string): Promise<User>;
}

export abstract class IListUsersUseCase {
 abstract execute(pageSize: number, pageState?: string): Promise<PageResult<User>>;
}

export abstract class IUpdateUserUseCase {
 abstract execute(id: string, dto: { name?: string; email?: string }): Promise<User>;
}

export abstract class IDeleteUserUseCase {
 abstract execute(id: string): Promise<void>;
}
