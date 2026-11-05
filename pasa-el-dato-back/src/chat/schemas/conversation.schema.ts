import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({
  collection: 'conversaciones',
  timestamps: { createdAt: 'creadaEn', updatedAt: 'actualizadaEn' },
})
export class Conversation {
  @Prop({ required: true })
  publicacionId!: string;

  @Prop({ required: true })
  vendedorCuentaId!: string;

  @Prop({ required: true })
  compradorCuentaId!: string;

  /**
   * Se almacena para cumplir el criterio de aceptación:
   * permitir contacto si estaba "Vendida", pero mostrar indicación.
   * Se persiste el estado al momento de crear por auditoría/historial.
   */
  @Prop({ required: true })
  estadoPublicacionAlCrear!: string;

  @Prop({ type: Date, default: null })
  ultimoMensajeEn!: Date | null;

  // timestamps generados por mongoose:
  creadaEn!: Date;
  actualizadaEn!: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index(
  { publicacionId: 1, vendedorCuentaId: 1, compradorCuentaId: 1 },
  { unique: true, name: 'ux_conversacion_publicacion_vendedor_comprador' },
);
