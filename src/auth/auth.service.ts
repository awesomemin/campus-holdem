import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './login.dto';
import { SignupDto } from './signup.dto';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  async signup(signupDto: SignupDto) {
    const hashedPassword = await bcryptjs.hash(signupDto.password, 12);
    const userWithHashedPassword = { ...signupDto, password: hashedPassword };
    const user = await this.usersService.createUser(userWithHashedPassword);
    const { password: _password, ...result } = user;
    return result;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (user && (await bcryptjs.compare(password, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid email or password');
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload = { sub: user.id };
    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }
}
