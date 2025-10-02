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

  async deleteProfilePicture(userId: number) {
    const currentUser = await this.findUserById(userId);

    if (!currentUser) {
      throw new ConflictException('User not found');
    }

    // Delete image from S3 if it exists
    if (currentUser.profilePictureUrl) {
      await this.s3Service.deleteFile(currentUser.profilePictureUrl);
    }

    // Update user record to remove profile picture URL
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePictureUrl: null,
        updated_at: new Date(),
      },
    });
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

  async getRankings(page: number, limit: number, userId?: number) {
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.user.count();

    // Get paginated rankings with rank calculation
    const usersWithRank = await this.prisma.$queryRaw<
      Array<{
        id: number;
        nickname: string;
        profilePictureUrl: string | null;
        ppi: number;
        rank: bigint;
      }>
    >`
      SELECT
        "id",
        "nickname",
        "profilePictureUrl",
        "ppi",
        RANK() OVER (ORDER BY "ppi" DESC) as rank
      FROM "User"
      ORDER BY "ppi" DESC, "id" ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    // Convert bigint to number for rank
    const rankings = usersWithRank.map((user) => ({
      userId: user.id,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      ppi: user.ppi,
      rank: Number(user.rank),
    }));

    // If user is logged in, get their ranking
    let myRanking:
      | {
          userId: number;
          nickname: string;
          profilePictureUrl: string | null;
          ppi: number;
          rank: number;
        }
      | undefined;
    if (userId) {
      const userRankData = await this.prisma.$queryRaw<
        Array<{
          id: number;
          nickname: string;
          profilePictureUrl: string | null;
          ppi: number;
          rank: bigint;
        }>
      >`
        SELECT * FROM (
          SELECT
            "id",
            "nickname",
            "profilePictureUrl",
            "ppi",
            RANK() OVER (ORDER BY "ppi" DESC) as rank
          FROM "User"
        ) ranked_users
        WHERE "id" = ${userId}
      `;

      if (userRankData.length > 0) {
        const user = userRankData[0];
        myRanking = {
          userId: user.id,
          nickname: user.nickname,
          profilePictureUrl: user.profilePictureUrl,
          ppi: user.ppi,
          rank: Number(user.rank),
        };
      }
    }

    return {
      rankings,
      total,
      page,
      limit,
      myRanking,
    };
  }
}
