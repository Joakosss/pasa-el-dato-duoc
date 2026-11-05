import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class IniciarConversacionDto {
  @ApiProperty({
    description: 'ID de la publicación desde la cual nace la conversación.',
    example: '5a7b3c59-3f8c-4f85-9d7f-8f3d3b0c4e2a',
  })
  @IsUUID()
  publicacionId!: string;
}
