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

  @Prop({ default: false })
  isSuperAdmin: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
