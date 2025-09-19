import { IsBoolean } from 'class-validator';

export class ApplyGameDto {
  @IsBoolean()
  useTicket: boolean;
}
