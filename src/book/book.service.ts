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

  constructor(
    @InjectModel(Book.name)
    private bookModel: Model<Book>,
  ) {}

  async create(filePath: string, title: string, isFree: any, price: any = 0) {
    const isFreeBool = String(isFree) === 'true';

    // Xử lý giá tiền
    const parsedPrice = parseInt(price, 10);
    const finalPrice = isNaN(parsedPrice) ? 0 : parsedPrice;

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
        { env: process.env },
      );
      this.logger.log(`✅ Đã tạo preview thành công tại: ${previewPath}`);
    } catch (err) {
      this.logger.error(`❌ PDFTK ERROR: ${err.message}`);
      throw new InternalServerErrorException(
        'Không thể tạo bản xem trước. Hãy đảm bảo macOS đã cài: brew install pdftk-java',
      );
    }

    return this.bookModel.create({
      title,
      isFree: isFreeBool,
      price: isFreeBool ? 0 : finalPrice, // Nếu miễn phí thì ép giá về 0
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

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findById(id: string) {
    return this.bookModel.findById(id);
  }

  async getPreviewStream(id: string): Promise<StreamableFile> {
    const book = await this.bookModel.findById(id);
    if (!book || !book.previewPath) {
      throw new NotFoundException(
        'Không tìm thấy dữ liệu hoặc sách chưa có bản xem trước',
      );
    }

    if (!fs.existsSync(book.previewPath)) {
      this.logger.error(`File không tồn tại ở đường dẫn: ${book.previewPath}`);
      throw new NotFoundException(
        'File xem trước đã bị xóa hoặc di chuyển khỏi máy chủ',
      );
    }

    const fileStream = fs.createReadStream(book.previewPath);
    return new StreamableFile(fileStream);
  }
}
