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
import { randomBytes } from 'crypto';

function toSlug(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function buildUsernameBase(saintName: string, displayName: string): string {
  const displayParts = displayName.trim().split(/\s+/).filter(Boolean);
  const parts =
    displayParts.length > 1
      ? displayParts
      : [saintName, displayName].join(' ').trim().split(/\s+/).filter(Boolean);

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

function generateTemporaryPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
  const bytes = randomBytes(length);

  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
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
      {
        id: admin._id,
        role: 'admin',
        name: fullName || admin.username || admin.email,
        isSuperAdmin: admin.isSuperAdmin,
        mustChangePassword: admin.mustChangePassword === true,
      },
      process.env.JWT_SECRET,
    );

    return {
      message: 'Đăng nhập thành công',
      data: { accessToken: token },
    };
  }

  async create(displayName: string, saintName: string) {
    if (!displayName?.trim()) throw new BadRequestException('Họ và tên không được để trống');
    if (!saintName?.trim()) throw new BadRequestException('Tên thánh không được để trống');

    const base = buildUsernameBase(saintName, displayName);
    const username = await this.generateUniqueUsername(base);
    const temporaryPassword = generateTemporaryPassword();

    const hash = await bcrypt.hash(temporaryPassword, 10);
    const admin = await this.adminModel.create({
      password: hash,
      displayName: displayName.trim(),
      saintName: saintName.trim(),
      username,
      mustChangePassword: true,
    });

    return {
      message: 'Tạo tài khoản admin thành công',
      data: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        temporaryPassword,
        displayName: admin.displayName,
        saintName: admin.saintName,
        mustChangePassword: admin.mustChangePassword,
      },
    };
  }

  async changePassword(adminId: string, oldPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const admin = await this.adminModel.findById(adminId);
    if (!admin) throw new NotFoundException('Không tìm thấy tài khoản admin');
    if (admin.isDeleted) throw new UnauthorizedException('Tài khoản đã bị đình chỉ');

    const valid = await bcrypt.compare(oldPassword || '', admin.password);
    if (!valid) throw new UnauthorizedException('Mật khẩu hiện tại không đúng');

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.mustChangePassword = false;
    await admin.save();

    const fullName = [admin.saintName, admin.displayName].filter(Boolean).join(' ');
    const token = jwt.sign(
      {
        id: admin._id,
        role: 'admin',
        name: fullName || admin.username || admin.email,
        isSuperAdmin: admin.isSuperAdmin,
        mustChangePassword: false,
      },
      process.env.JWT_SECRET,
    );

    return {
      message: 'Đổi mật khẩu thành công',
      data: { accessToken: token },
    };
  }

  async resetPassword(targetId: string) {
    const target = await this.adminModel.findById(targetId);
    if (!target) throw new NotFoundException('Không tìm thấy tài khoản admin');
    if (target.isSuperAdmin) throw new ForbiddenException('Không thể reset mật khẩu tài khoản hệ thống');
    if (target.isDeleted) throw new ForbiddenException('Không thể reset mật khẩu tài khoản đang bị đình chỉ');

    const temporaryPassword = generateTemporaryPassword();
    target.password = await bcrypt.hash(temporaryPassword, 10);
    target.mustChangePassword = true;
    await target.save();

    return {
      message: 'Reset mật khẩu admin thành công',
      data: {
        id: target._id,
        username: target.username,
        temporaryPassword,
        mustChangePassword: target.mustChangePassword,
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
