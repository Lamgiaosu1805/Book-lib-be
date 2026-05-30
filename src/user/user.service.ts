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
      if (existed.googleId) {
        throw new BadRequestException('Email này đã được đăng ký bằng Google. Vui lòng đăng nhập bằng Google.');
      }
      throw new BadRequestException('Email này đã được đăng ký. Vui lòng đăng nhập.');
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
  async loginWithGoogle(profile: { email: string; googleId: string; displayName: string }): Promise<string> {
    let user = await this.userModel.findOne({ email: profile.email });

    if (!user) {
      const randomPassword = await bcrypt.hash(profile.googleId + Date.now(), 10);
      user = await this.userModel.create({
        email: profile.email,
        password: randomPassword,
        googleId: profile.googleId,
        displayName: profile.displayName,
      });
    } else {
      if (user.isDeleted) {
        throw new UnauthorizedException('Tài khoản đã bị đình chỉ');
      }
      let needSave = false;
      if (!user.googleId) { user.googleId = profile.googleId; needSave = true; }
      if (!user.displayName && profile.displayName) { user.displayName = profile.displayName; needSave = true; }
      if (needSave) await user.save();
    }

    return jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').exec();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async updateProfile(userId: string, displayName: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { displayName },
      { new: true },
    ).select('-password');
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new BadRequestException('Mật khẩu cũ không đúng');
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: 'Đổi mật khẩu thành công' };
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
