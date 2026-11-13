import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class IniciarConversacionMobileDto {
  @IsUUID()
  publicacionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  texto!: string;
}
