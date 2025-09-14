import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../generated/prisma';
import { UsersService, CreateUserDto } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload = {
      email: user.email,
      sub: user.id,
      nickname: user.nickname,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        ppi: user.ppi,
      },
    };
  }

  async signUp(createUserDto: CreateUserDto) {
    const existingUserByEmail = await this.usersService.findByEmail(
      createUserDto.email,
    );
    if (existingUserByEmail) {
      throw new BadRequestException('Email already exists');
    }

    const existingUserByNickname = await this.usersService.findByNickname(
      createUserDto.nickname,
    );
    if (existingUserByNickname) {
      throw new BadRequestException('Nickname already exists');
    }

    const existingUserByPhone = await this.usersService.findByPhoneNumber(
      createUserDto.phoneNumber,
    );
    if (existingUserByPhone) {
      throw new BadRequestException('Phone number already exists');
    }

    const user = await this.usersService.create(createUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;

    const payload = {
      email: result.email,
      sub: result.id,
      nickname: result.nickname,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: result.id,
        email: result.email,
        nickname: result.nickname,
        ppi: result.ppi,
      },
    };
  }
}
