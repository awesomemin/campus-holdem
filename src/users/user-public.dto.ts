export class UserPublicDto {
  id: number;
  nickname: string;
  profilePictureUrl: string | null;
  ppi: number;
  created_at: Date;
  ticketBalance: number;
}
