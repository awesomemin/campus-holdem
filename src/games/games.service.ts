import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

  async applyToGame(gameId: number, userId: number, useTicket: boolean) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game._count.participants >= game.maxParticipant) {
      throw new BadRequestException('Game is already full');
    }

    const existingParticipant = await this.prisma.participant.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId,
        },
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('User is already registered for this game');
    }

    if (useTicket) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.ticketBalance < 1) {
        throw new BadRequestException('Insufficient tickets');
      }

      return this.prisma.$transaction(async (prisma) => {
        await prisma.user.update({
          where: { id: userId },
          data: {
            ticketBalance: {
              decrement: 1,
            },
          },
        });

        return prisma.participant.create({
          data: {
            gameId,
            userId,
            status: 'CONFIRMED',
            usedTicket: true,
          },
        });
      });
    }

    return this.prisma.participant.create({
      data: {
        gameId,
        userId,
        status: 'SUSPENDED',
        usedTicket: false,
      },
    });
  }
}
