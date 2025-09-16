import { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  email: string;
  nickname: string;
  phoneNumber: string;
  profilePictureUrl: string | null;
  ppi: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}
