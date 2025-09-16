import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { GamesService } from './games.service';

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
}
