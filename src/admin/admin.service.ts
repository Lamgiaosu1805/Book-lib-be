import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    if (!admin) {
      throw new UnauthorizedException('Không tìm thấy admin');
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      throw new UnauthorizedException('Sai mật khẩu');
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
    );

    return {
      message: 'Login admin thành công',
      data: {
        accessToken: token,
      },
    };
  }
}
