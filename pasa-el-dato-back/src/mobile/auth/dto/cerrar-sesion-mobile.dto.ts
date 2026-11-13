import { IsNotEmpty, IsString } from 'class-validator';

export class CerrarSesionMobileDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
