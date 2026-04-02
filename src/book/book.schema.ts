import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Book {
  @Prop()
  title: string;

  @Prop()
  isFree: boolean;

  @Prop()
  filePath: string;

  @Prop()
  previewPath: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);
