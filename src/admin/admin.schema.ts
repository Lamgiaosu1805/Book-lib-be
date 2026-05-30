import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Admin extends Document {
  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'admin' })
  role: string;

  @Prop({ default: '' })
  displayName: string;

  @Prop({ default: '' })
  saintName: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
