export interface UserRankingDto {
  userId: number;
  nickname: string;
  profilePictureUrl: string | null;
  ppi: number;
  rank: number;
}

export interface UserRankingsResponseDto {
  rankings: UserRankingDto[];
  total: number;
  page: number;
  limit: number;
  myRanking?: UserRankingDto;
}
