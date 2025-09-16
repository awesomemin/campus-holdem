import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllGames() {
    return this.prisma.game.findMany({
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async getGameById(id: number) {
    return this.prisma.game.findUnique({
      where: {
        id,
      },
      include: {
        participants: {
          select: {
            userId: true,
            status: true,
            rank: true,
            ppiChange: true,
            User: {
              select: {
                id: true,
                nickname: true,
                profilePictureUrl: true,
                ppi: true,
              },
            },
          },
        },
      },
    });
  }
}
