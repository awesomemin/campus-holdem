import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ParticipantRankDto {
  @IsInt()
  userId: number;

  @IsInt()
  rank: number;
}

export class FinishGameDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantRankDto)
  rankings: ParticipantRankDto[];
}
