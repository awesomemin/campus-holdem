import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(5)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(10)
  nickname: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^010\d{8}$/, {
    message:
      'Phone number must be in format 010XXXXXXXX (11 digits starting with 010)',
  })
  phoneNumber: string;
}
