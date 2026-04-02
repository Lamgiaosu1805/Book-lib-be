import { BadRequestException, Injectable } from '@nestjs/common';
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
    const user = await this.userModel.findOne({ email });

    if (!user) throw new Error('Không tìm thấy user');

    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new Error('Sai mật khẩu');

    return jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET);
  }
}
