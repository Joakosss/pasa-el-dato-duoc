import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type MensajeDocument = HydratedDocument<Mensaje>;

@Schema({
  collection: 'mensajes',
  timestamps: false,
})
export class Mensaje {
  @Prop({ type: Types.ObjectId, required: true })
  conversacionId!: Types.ObjectId;

  @Prop({ required: true })
  emisorCuentaId!: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  texto!: string;

  @Prop({ type: Date, default: Date.now })
  enviadoEn!: Date;
}

export const MensajeSchema = SchemaFactory.createForClass(Mensaje);

MensajeSchema.index(
  { conversacionId: 1, enviadoEn: -1 },
  { name: 'ix_mensajes_conversacion_enviadoEn_desc' },
);

MensajeSchema.index(
  { conversacionId: 1, _id: -1 },
  { name: 'ix_mensajes_conversacion_id_desc' },
);
