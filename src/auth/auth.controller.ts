import {
  Controller,
  Post,
  Body,
  // Get,
  // UseGuards,
  // Request,
} from '@nestjs/common';
import { SignupDto } from './signup.dto';
import { LoginDto } from './login.dto';
import { AuthService } from './auth.service';
// import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return await this.authService.signup(signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  // @UseGuards(JwtAuthGuard)
  // @Get('profile')
  // getProfile(@Request() req: any) {
  //   return req.user;
  // }
}
