import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseIntPipe,
  UseGuards,
  Request,
  Patch,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OptionalJwtAuthGuard } from '../auth/optional-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/auth-request.interface';
import { UsersService } from './users.service';
import { UserPublicDto } from './user-public.dto';
import { UserPrivateDto } from './user-private.dto';
import { UpdateUserDto } from './update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('applylist')
  @UseGuards(JwtAuthGuard)
  async getUserApplyList(@Request() req: AuthRequest) {
    return this.usersService.getUserApplyList(req.user!.id);
  }

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

  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit (will be resized if > 5MB)
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(new Error('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async updateUserProfile(
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() profilePicture: Express.Multer.File | undefined,
    @Request() req: AuthRequest,
  ) {
    const updateData: {
      email?: string;
      phoneNumber?: string;
      nickname?: string;
      profilePicture?: Express.Multer.File;
    } = {
      email: updateUserDto.email,
      phoneNumber: updateUserDto.phoneNumber,
      nickname: updateUserDto.nickname,
    };

    if (profilePicture) {
      updateData.profilePicture = profilePicture;
    }

    const updatedUser = await this.usersService.updateUser(
      req.user!.id,
      updateData,
    );

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      phoneNumber: updatedUser.phoneNumber,
      profilePictureUrl: updatedUser.profilePictureUrl,
    };
  }

  @Delete('profile-picture')
  @UseGuards(JwtAuthGuard)
  async deleteProfilePicture(@Request() req: AuthRequest) {
    const updatedUser = await this.usersService.deleteProfilePicture(
      req.user!.id,
    );

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      phoneNumber: updatedUser.phoneNumber,
      profilePictureUrl: updatedUser.profilePictureUrl,
      message: 'Profile picture deleted successfully',
    };
  }
}
