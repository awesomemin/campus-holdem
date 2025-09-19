import { Injectable, ConflictException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
}
