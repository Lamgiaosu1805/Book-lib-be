// book.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Book extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  isFree: boolean;

  // ✅ Thêm trường giá tiền
  @Prop({ default: 0 })
  price: number;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  previewPath: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);
