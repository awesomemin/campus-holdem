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
    const games = await this.prisma.game.findMany({
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
        participants: {
          where: {
            rank: 1,
          },
          select: {
            User: {
              select: {
                nickname: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    return games.map((game) => ({
      ...game,
      winner:
        game.status === 'COMPLETED' && game.participants.length > 0
          ? game.participants[0].User
          : null,
      participants: undefined,
    }));
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
          orderBy: [
            {
              rank: 'asc',
            },
            {
              createdAt: 'asc',
            },
            {
              userId: 'asc',
            },
          ],
        },
      },
    });
  }

  async finishGame(
    gameId: number,
    rankings: { userId: number; rank: number }[],
  ) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        participants: {
          include: {
            User: {
              select: {
                ppi: true,
              },
            },
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== 'PROGRESS') {
      throw new BadRequestException('Game is not in progress');
    }

    // Prepare data for PPI calculation
    const participantData = game.participants.map((participant) => {
      const ranking = rankings.find((r) => r.userId === participant.userId);
      return {
        userId: participant.userId,
        ranking: ranking?.rank || 999, // Default high rank if not found
        ppi: participant.User.ppi,
      };
    });

    // Calculate PPI changes
    const ppiChanges = this._calculatePPIChange(participantData);

    return this.prisma.$transaction(async (prisma) => {
      // Update participant ranks and PPI changes
      for (const ranking of rankings) {
        const ppiChange =
          ppiChanges.find((p) => p.userId === ranking.userId)?.ppiChange || 0;

        let ticketChange: number;
        if (ranking.rank <= 3) ticketChange = 1;
        else ticketChange = 0;

        await prisma.participant.update({
          where: {
            gameId_userId: {
              gameId,
              userId: ranking.userId,
            },
          },
          data: {
            rank: ranking.rank,
            ppiChange,
            ticketChange,
          },
        });

        // Update user's PPI based on ppiChange
        await prisma.user.update({
          where: { id: ranking.userId },
          data: {
            ppi: {
              increment: ppiChange,
            },
            ticketBalance: {
              increment: ticketChange,
            },
          },
        });
      }

      // Update game status to completed
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'COMPLETED',
        },
      });

      return { success: true, message: 'Game finished successfully' };
    });
  }

  _calculatePPIChange(
    participantData: { userId: number; ranking: number; ppi: number }[],
  ): { userId: number; ppiChange: number }[] {
    const K = 24;
    const actualScore = new Array(participantData.length).fill(0);
    const expectedScore = new Array(participantData.length).fill(0);
    for (let i = 0; i < participantData.length; i++) {
      for (let j = 0; j < participantData.length; j++) {
        if (i === j) continue;
        if (participantData[i].ranking < participantData[j].ranking)
          actualScore[i]++;
        if (participantData[i].ranking === participantData[j].ranking)
          actualScore[i] += 0.5;
        expectedScore[i] +=
          1 /
          (1 + 10 ** ((participantData[j].ppi - participantData[i].ppi) / 400));
      }
    }
    const ppiChange: number[] = new Array<number>(participantData.length).fill(
      0,
    );
    for (let i = 0; i < participantData.length; i++) {
      ppiChange[i] = Math.round(K * (actualScore[i] - expectedScore[i]));
    }

    return participantData.map((p, i) => ({
      userId: p.userId,
      ppiChange: ppiChange[i],
    }));
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

    if (game.status !== 'PLANNED') {
      throw new BadRequestException('Game is not available.');
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
