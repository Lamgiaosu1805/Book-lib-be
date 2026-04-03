import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book } from './book.schema';
import { Model } from 'mongoose';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execPromise = promisify(exec);

@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);

  constructor(@InjectModel(Book.name) private bookModel: Model<Book>) {}

  // ✅ Hàm create nhận đủ 8 tham số
  async create(
    filePath: string,
    title: string,
    isFree: any,
    price: any = 0,
    author: string,
    category: string,
    publishedYear: any,
    description: string,
  ) {
    const isFreeBool = String(isFree) === 'true';
    const parsedPrice = parseInt(price, 10);
    const finalPrice = isNaN(parsedPrice) ? 0 : parsedPrice;
    const finalYear = parseInt(publishedYear, 10) || new Date().getFullYear();

    const absoluteFullContentPath = path.resolve(filePath);
    const previewPath = absoluteFullContentPath.replace(
      `${path.sep}full${path.sep}`,
      `${path.sep}preview${path.sep}`,
    );

    const previewDir = path.dirname(previewPath);
    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir, { recursive: true });
    }

    try {
      await execPromise(
        `pdftk "${absoluteFullContentPath}" cat 1 output "${previewPath}"`,
      );
    } catch (err) {
      this.logger.error(`❌ PDFTK ERROR: ${err.message}`);
      throw new InternalServerErrorException('Lỗi tạo bản xem trước PDF');
    }

    // Lưu xuống MongoDB
    return this.bookModel.create({
      title,
      author: author || 'Chưa cập nhật',
      category: category || 'Chưa cập nhật',
      publishedYear: finalYear,
      description: description || '',
      isFree: isFreeBool,
      price: isFreeBool ? 0 : finalPrice,
      filePath: absoluteFullContentPath,
      previewPath: previewPath,
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, totalItems] = await Promise.all([
      this.bookModel
        .find()
        .select('-filePath -previewPath')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bookModel.countDocuments(),
    ]);
    return {
      items: data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async getBookDetails(id: string) {
    const book = await this.bookModel
      .findById(id)
      .select('-filePath -previewPath')
      .exec();
    if (!book) throw new NotFoundException('Sách không tồn tại');
    return book;
  }

  async getPreviewStream(id: string): Promise<StreamableFile> {
    const book = await this.bookModel.findById(id);
    if (!book || !fs.existsSync(book.previewPath))
      throw new NotFoundException('File không tồn tại');
    return new StreamableFile(fs.createReadStream(book.previewPath));
  }

  async getFullBookStream(id: string, user: any): Promise<StreamableFile> {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Sách không tồn tại');
    const isAdmin = user?.role === 'admin';
    const targetPath =
      book.isFree || isAdmin ? book.filePath : book.previewPath;
    return new StreamableFile(fs.createReadStream(targetPath));
  }
}
