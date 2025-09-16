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
}
