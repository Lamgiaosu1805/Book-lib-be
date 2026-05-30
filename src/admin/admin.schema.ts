import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Admin extends Document {
  @Prop()
  email?: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'admin' })
  role: string;

  @Prop({ default: '' })
  displayName: string;

  @Prop({ default: '' })
  saintName: string;

  @Prop({ unique: true, sparse: true })
  username: string;

  @Prop({ default: false })
  isSuperAdmin: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  mustChangePassword: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

AdminSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' } },
  },
);
