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

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private adminModel: Model<Admin>,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.adminModel.findOne({ email });
    if (!admin) throw new UnauthorizedException('Không tìm thấy tài khoản admin');

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

    const hash = await bcrypt.hash(password, 10);
    const admin = await this.adminModel.create({
      email,
      password: hash,
      displayName,
      saintName,
    });

    return {
      message: 'Tạo tài khoản admin thành công',
      data: {
        id: admin._id,
        email: admin.email,
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
