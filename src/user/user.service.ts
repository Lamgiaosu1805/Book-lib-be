import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async register(email: string, password: string) {
    const existed = await this.userModel.findOne({ email });
    if (existed) {
      throw new BadRequestException('Email đã tồn tại');
    }
    try {
      const hash = await bcrypt.hash(password, 10);
      return await this.userModel.create({
        email,
        password: hash,
      });
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestException('Email đã tồn tại');
      }
      throw err;
    }
  }

  async login(email: string, password: string) {
    // Chỉ cho phép đăng nhập nếu chưa bị xoá mềm (isDeleted: false)
    const user = await this.userModel.findOne({ email, isDeleted: false });
    if (!user) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc đã bị đình chỉ',
      );
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Sai mật khẩu');
    }
    const token = jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );
    return {
      message: 'Đăng nhập thành công',
      data: {
        accessToken: token,
        user: {
          id: user._id,
          email: user.email,
        },
      },
    };
  }

  // ✅ LẤY TẤT CẢ USER (Cả hoạt động & đã xóa) ĐỂ FRONTEND LÀM THỐNG KÊ
  async findAll() {
    return this.userModel
      .find() // Bỏ điều kiện isDeleted để lấy trọn bộ
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  // ✅ ĐÌNH CHỈ (XOÁ MỀM)
  async remove(id: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return { message: 'Đã đình chỉ tài khoản' };
  }

  // ✅ KHÔI PHỤC (RESTORE)
  async restore(id: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { isDeleted: false },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return { message: 'Đã khôi phục tài khoản' };
  }
  async getMyLibrary(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('purchasedBooks')
      .exec();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user.purchasedBooks;
  }

  // ✅ API CHO USER: Mua sách / Thêm sách vào tủ
  async addToLibrary(userId: string, bookId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Kiểm tra xem đã có sách trong tủ chưa
    if (user.purchasedBooks.includes(bookId as any)) {
      throw new BadRequestException(
        'Cuốn sách này đã có trong tủ sách của bạn!',
      );
    }

    user.purchasedBooks.push(bookId as any);
    await user.save();

    return { message: 'Đã thêm sách vào tủ sách của bạn thành công!' };
  }
}
