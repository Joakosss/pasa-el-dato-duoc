import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EnviarMensajeMobileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  texto!: string;
}
