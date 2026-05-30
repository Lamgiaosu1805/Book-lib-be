import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ required: true })
  adminId: string;

  @Prop({ required: true })
  adminName: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  targetType: string;

  @Prop({ default: '' })
  targetId: string;

  @Prop({ default: '' })
  targetTitle: string;

  @Prop({ default: '' })
  detail: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
