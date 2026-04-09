import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  ConflictException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CREATE_USER_USE_CASE,
  DELETE_USER_USE_CASE,
  FIND_USER_USE_CASE,
  LIST_USERS_USE_CASE,
  UPDATE_USER_USE_CASE,
} from '../../domain/tokens';
import {
  ICreateUserUseCase,
  IDeleteUserUseCase,
  IFindUserUseCase,
  IListUsersUseCase,
  IUpdateUserUseCase,
} from '../../domain/ports/inbound/user-use-cases.port';
import { EmailConflictException } from '../../domain/exceptions/email-conflict.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

interface PaginatedResponse {
  data: UserResponseDto[];
  nextPageState: string | null;
}

@Controller('users')
export class UserController {
  constructor(
    @Inject(CREATE_USER_USE_CASE)
    private readonly createUserUseCase: ICreateUserUseCase,
    @Inject(FIND_USER_USE_CASE)
    private readonly findUserUseCase: IFindUserUseCase,
    @Inject(LIST_USERS_USE_CASE)
    private readonly listUsersUseCase: IListUsersUseCase,
    @Inject(UPDATE_USER_USE_CASE)
    private readonly updateUserUseCase: IUpdateUserUseCase,
    @Inject(DELETE_USER_USE_CASE)
    private readonly deleteUserUseCase: IDeleteUserUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.createUserUseCase.execute(dto);
      return UserResponseDto.fromDomain(user);
    } catch (err) {
      if (err instanceof EmailConflictException) {
        throw new ConflictException(err.message);
      }
      throw err;
    }
  }

  @Get()
  async findAll(
    @Query('pageSize') pageSize = '20',
    @Query('pageState') pageState?: string,
  ): Promise<PaginatedResponse> {
    const size = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    const result = await this.listUsersUseCase.execute(size, pageState);
    return {
      data: result.data.map(UserResponseDto.fromDomain),
      nextPageState: result.nextPageState,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    try {
      const user = await this.findUserUseCase.execute(id);
      return UserResponseDto.fromDomain(user);
    } catch (err) {
      if (err instanceof UserNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.updateUserUseCase.execute(id, dto);
      return UserResponseDto.fromDomain(user);
    } catch (err) {
      if (err instanceof UserNotFoundException) {
        throw new NotFoundException(err.message);
      }
      if (err instanceof EmailConflictException) {
        throw new ConflictException(err.message);
      }
      throw err;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    try {
      await this.deleteUserUseCase.execute(id);
    } catch (err) {
      if (err instanceof UserNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }
}
