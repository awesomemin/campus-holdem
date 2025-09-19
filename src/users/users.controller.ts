import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/optional-auth.guard';
import type { AuthRequest } from '../auth/auth-request.interface';
import { UsersService } from './users.service';
import { UserPublicDto } from './user-public.dto';
import { UserPrivateDto } from './user-private.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
  ): Promise<UserPublicDto | UserPrivateDto> {
    const user = await this.usersService.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOwnProfile = req.user && req.user.id === id;

    if (isOwnProfile) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        phoneNumber: user.phoneNumber,
        profilePictureUrl: user.profilePictureUrl,
        ppi: user.ppi,
        ticketBalance: user.ticketBalance,
        created_at: user.created_at,
      };
    }

    return {
      id: user.id,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      ppi: user.ppi,
      ticketBalance: user.ticketBalance,
      created_at: user.created_at,
    };
  }
}
