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
    // Chuyển đổi isFree về dạng boolean nếu nhận từ form-data (string)
    const isFreeBool = String(isFree) === 'true';
    const previewPath = filePath.replace('/full/', '/preview/');

    // Tạo preview trang 1 (Đảm bảo folder /preview/ đã tồn tại)
    exec(
      `pdftk ${filePath} cat 1 output ${previewPath}`,
      (err, stdout, stderr) => {
        if (err) {
          console.error('PDFTK ERROR:', err);
          return;
        }

        console.log('Preview created:', previewPath);
      },
    );

    return this.bookModel.create({
      title,
      isFree: isFreeBool,
      filePath,
      previewPath,
    });
  }

  // API Lấy danh sách có phân trang và ẩn đường dẫn file
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Chạy song song: Đếm tổng số và Lấy dữ liệu trang hiện tại
    const [data, totalItems] = await Promise.all([
      this.bookModel
        .find()
        .select('-filePath -previewPath') // ❌ Không trả về đường dẫn file
        .sort({ createdAt: -1 }) // Sách mới nhất lên đầu
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
}
