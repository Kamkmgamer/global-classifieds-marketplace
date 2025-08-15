import { IsString, IsNumber, IsOptional, IsUrl, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateListingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  price: number;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}