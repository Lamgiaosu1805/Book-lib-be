import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isDeleted: boolean;

  // ✅ THÊM KHO SÁCH CÁ NHÂN
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    default: [],
  })
  purchasedBooks: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
