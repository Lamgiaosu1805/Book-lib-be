import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Admin } from './admin.schema';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

function toSlug(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// "Nghiêm Khắc Lâm" → "lamnk"  (chỉ dùng displayName, saintName là tiền tố tôn giáo)
function buildUsernameBase(saintName: string, displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return toSlug(saintName) || 'admin';
  }

  const ten = toSlug(parts[parts.length - 1]);
  const initials = parts
    .slice(0, -1)
    .map((p) => toSlug(p).charAt(0))
    .join('');

  return ten + initials || 'admin';
}

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private adminModel: Model<Admin>,
  ) {}

  private async generateUniqueUsername(base: string): Promise<string> {
    if (!base) base = 'admin';
    let username = base;
    let counter = 1;
    while (await this.adminModel.exists({ username })) {
      username = `${base}${counter}`;
      counter++;
    }
    return username;
  }

  async login(identifier: string, password: string) {
    const admin = await this.adminModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!admin) throw new UnauthorizedException('Không tìm thấy tài khoản admin');
    if (admin.isDeleted) throw new UnauthorizedException('Tài khoản đã bị đình chỉ');

    const match = await bcrypt.compare(password, admin.password);
    if (!match) throw new UnauthorizedException('Sai mật khẩu');

    const fullName = [admin.saintName, admin.displayName].filter(Boolean).join(' ');

    const token = jwt.sign(
      { id: admin._id, role: 'admin', name: fullName || admin.email, isSuperAdmin: admin.isSuperAdmin },
      process.env.JWT_SECRET,
    );

    return {
      message: 'Đăng nhập thành công',
      data: { accessToken: token },
    };
  }

  async create(email: string, password: string, displayName: string, saintName: string) {
    const existed = await this.adminModel.findOne({ email });
    if (existed) throw new BadRequestException('Email này đã được sử dụng');

    const base = buildUsernameBase(saintName, displayName);
    const username = await this.generateUniqueUsername(base);

    const hash = await bcrypt.hash(password, 10);
    const admin = await this.adminModel.create({
      email,
      password: hash,
      displayName,
      saintName,
      username,
    });

    return {
      message: 'Tạo tài khoản admin thành công',
      data: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        displayName: admin.displayName,
        saintName: admin.saintName,
      },
    };
  }

  async findAll() {
    return this.adminModel
      .find()
      .select('-password')
      .sort({ isSuperAdmin: -1, createdAt: 1 })
      .exec();
  }

  async softDelete(targetId: string, requesterId: string) {
    const target = await this.adminModel.findById(targetId);
    if (!target) throw new NotFoundException('Không tìm thấy tài khoản admin');
    if (target.isSuperAdmin) throw new ForbiddenException('Không thể xóa tài khoản hệ thống');
    if (String(target._id) === requesterId) throw new ForbiddenException('Không thể tự xóa tài khoản của mình');
    target.isDeleted = true;
    await target.save();
    return { message: 'Đã đình chỉ tài khoản admin' };
  }

  async restore(targetId: string) {
    const target = await this.adminModel.findById(targetId);
    if (!target) throw new NotFoundException('Không tìm thấy tài khoản admin');
    target.isDeleted = false;
    await target.save();
    return { message: 'Đã khôi phục tài khoản admin' };
  }
}
