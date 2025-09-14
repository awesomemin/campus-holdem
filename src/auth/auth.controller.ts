import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { User } from '../../generated/prisma';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @Request() req: { user: Omit<User, 'password'> },
  ): Omit<User, 'password'> {
    return req.user;
  }
}
