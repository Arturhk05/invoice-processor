import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'NF-e access key (44 digits)',
    example: '35240112345678000195550010000001231000001230',
  })
  @IsString()
  @Length(44, 44)
  @Matches(/^\d{44}$/)
  accessKey!: string;

  @ApiProperty({
    description: 'Issuer CNPJ (14 digits, no formatting)',
    example: '12345678000195',
  })
  @IsString()
  @Length(14, 14)
  @Matches(/^\d{14}$/)
  issuerCnpj!: string;

  @ApiProperty({
    description: 'Recipient CNPJ (14 digits, no formatting)',
    example: '98765432000100',
  })
  @IsString()
  @Length(14, 14)
  @Matches(/^\d{14}$/)
  recipientCnpj!: string;

  @ApiProperty({
    description: 'Invoice issuance date (ISO 8601)',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  issuedAt!: string;

  @ApiProperty({ description: 'Total invoice amount in BRL', example: 1500.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  totalAmount!: number;
}
