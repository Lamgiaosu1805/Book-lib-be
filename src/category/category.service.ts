import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './category.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<Category>,
  ) {}

  async create(name: string) {
    const existing = await this.categoryModel.findOne({ name, isDeleted: { $ne: true } });
    if (existing) throw new ConflictException('Danh mục này đã tồn tại');
    return this.categoryModel.create({ name });
  }

  async findAll(status: 'active' | 'deleted' = 'active') {
    const filter = status === 'deleted' ? { isDeleted: true } : { isDeleted: { $ne: true } };
    return this.categoryModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string) {
    return this.categoryModel.findById(id).exec();
  }

  async softDelete(id: string) {
    const cat = await this.categoryModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!cat) throw new NotFoundException('Danh mục không tồn tại');
    return { message: 'Đã xóa mềm danh mục' };
  }

  async restore(id: string) {
    const cat = await this.categoryModel.findByIdAndUpdate(id, { isDeleted: false }, { new: true });
    if (!cat) throw new NotFoundException('Danh mục không tồn tại');
    return { message: 'Đã khôi phục danh mục', data: cat };
  }

  async hardDelete(id: string) {
    const cat = await this.categoryModel.findById(id);
    if (!cat) throw new NotFoundException('Danh mục không tồn tại');
    if (!cat.isDeleted) throw new BadRequestException('Chỉ có thể xóa vĩnh viễn danh mục đã xóa mềm trước đó');
    await this.categoryModel.findByIdAndDelete(id);
    return { message: 'Đã xóa vĩnh viễn danh mục' };
  }
}
