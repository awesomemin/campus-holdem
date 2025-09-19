export class UserPrivateDto {
  id: number;
  email: string;
  name: string;
  nickname: string;
  phoneNumber: string;
  profilePictureUrl: string | null;
  ppi: number;
  created_at: Date;
}
