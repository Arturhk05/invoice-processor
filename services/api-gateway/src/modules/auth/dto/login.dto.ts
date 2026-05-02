import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@invoice-processor.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin123456', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
