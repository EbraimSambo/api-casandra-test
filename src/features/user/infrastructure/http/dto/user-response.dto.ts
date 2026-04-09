import { User } from '../../../domain/entities/user.entity';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;

  static fromDomain(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id.value;
    dto.name = user.name;
    dto.email = user.email.value;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
