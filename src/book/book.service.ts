import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book } from './book.schema';
import { Model } from 'mongoose';
import { exec } from 'child_process';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name)
    private bookModel: Model<Book>,
  ) {}

  async create(filePath: string, title: string, isFree: boolean) {
    const previewPath = filePath.replace('/full/', '/preview/');

    // tạo preview trang 1
    exec(`pdftk ${filePath} cat 1 output ${previewPath}`);

    return this.bookModel.create({
      title,
      isFree,
      filePath,
      previewPath,
    });
  }

  async findAll() {
    return this.bookModel.find();
  }

  async findById(id: string) {
    return this.bookModel.findById(id);
  }
}
