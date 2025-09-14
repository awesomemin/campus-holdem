import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/, {
    message:
      'Password must be 8-20 characters long and contain both letters and numbers',
  })
  password: string;

  @IsString()
  @MinLength(3)
  @MaxLength(10)
  nickname: string;

  @IsString()
  phoneNumber: string;
}
