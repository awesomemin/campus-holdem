import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { ApplyGameDto } from './apply-game.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/auth-request.interface';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('all')
  async getAllGames() {
    return this.gamesService.getAllGames();
  }

  @Get(':id')
  async getGameById(@Param('id', ParseIntPipe) id: number) {
    const game = await this.gamesService.getGameById(id);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return game;
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard)
  async applyToGame(
    @Param('id', ParseIntPipe) id: number,
    @Body() applyGameDto: ApplyGameDto,
    @Request() req: AuthRequest,
  ) {
    return this.gamesService.applyToGame(
      id,
      req.user!.id,
      applyGameDto.useTicket,
    );
  }
}
