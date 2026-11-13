import { IsNotEmpty, IsString } from 'class-validator';

export class RenovarSesionMobileDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
