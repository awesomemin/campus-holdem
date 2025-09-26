import { Injectable, ConflictException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    nickname: string;
    phoneNumber: string;
  }) {
    try {
      return await this.prisma.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
          nickname: userData.nickname,
          phoneNumber: userData.phoneNumber,
        },
      });
    } catch (error) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target;
        if (!Array.isArray(target)) {
          throw new ConflictException(
            'User with this information already exists',
          );
        }
        if (target.includes('email')) {
          throw new ConflictException('Email already exists');
        }
        if (target.includes('nickname')) {
          throw new ConflictException('Nickname already exists');
        }
        if (target.includes('phoneNumber')) {
          throw new ConflictException('Phone number already exists');
        }
      }
      throw error;
    }
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserByPhoneNumber(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: { phoneNumber },
    });
  }

  async findUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findUserByNickname(nickname: string) {
    return this.prisma.user.findUnique({
      where: { nickname },
    });
  }

  async getUserApplyList(userId: number) {
    return this.prisma.game.findMany({
      where: {
        status: 'PLANNED',
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        time: true,
        place: true,
        status: true,
        participants: {
          where: {
            userId: userId,
          },
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        time: 'asc',
      },
    });
  }

  async updateUser(
    userId: number,
    updateData: {
      email?: string;
      phoneNumber?: string;
      nickname?: string;
      profilePicture?: Express.Multer.File;
    },
  ) {
    try {
      let profilePictureUrl: string | undefined;

      if (updateData.profilePicture) {
        const currentUser = await this.findUserById(userId);

        if (currentUser?.profilePictureUrl) {
          await this.s3Service.deleteFile(currentUser.profilePictureUrl);
        }

        profilePictureUrl = await this.s3Service.uploadFile(
          updateData.profilePicture,
          'profile-images',
        );
      }

      const dataToUpdate: {
        email?: string;
        phoneNumber?: string;
        nickname?: string;
        profilePictureUrl?: string;
        updated_at: Date;
      } = {
        email: updateData.email,
        phoneNumber: updateData.phoneNumber,
        nickname: updateData.nickname,
        updated_at: new Date(),
      };

      if (profilePictureUrl) {
        dataToUpdate.profilePictureUrl = profilePictureUrl;
      }

      const filteredData = Object.fromEntries(
        Object.entries(dataToUpdate).filter(
          ([_, value]) => value !== undefined,
        ),
      );

      return await this.prisma.user.update({
        where: { id: userId },
        data: filteredData,
      });
    } catch (error) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target;
        if (!Array.isArray(target)) {
          throw new ConflictException(
            'User with this information already exists',
          );
        }
        if (target.includes('email')) {
          throw new ConflictException('Email already exists');
        }
        if (target.includes('nickname')) {
          throw new ConflictException('Nickname already exists');
        }
        if (target.includes('phoneNumber')) {
          throw new ConflictException('Phone number already exists');
        }
      }
      throw error;
    }
  }

  async updateProfileImage(userId: number, profilePictureUrl: string) {
    const currentUser = await this.findUserById(userId);

    // Delete old image from S3 if it exists
    if (currentUser?.profilePictureUrl) {
      // We'll handle this in a separate method or leave it for now
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePictureUrl,
        updated_at: new Date(),
      },
    });
  }
}
