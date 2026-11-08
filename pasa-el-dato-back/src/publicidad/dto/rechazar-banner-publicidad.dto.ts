import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RechazarBannerPublicidadDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  motivo!: string;
}
