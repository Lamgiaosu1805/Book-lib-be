import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Book extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ default: 'Chưa cập nhật' })
  author: string;

  @Prop({ default: 'Chưa cập nhật' })
  category: string;

  @Prop({ default: new Date().getFullYear() })
  publishedYear: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  isFree: boolean;

  @Prop({ default: 0 })
  price: number;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  previewPath: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);
