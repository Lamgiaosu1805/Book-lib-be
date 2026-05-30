import { Injectable, ConflictException } from '@nestjs/common';
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
    const existing = await this.categoryModel.findOne({ name });
    if (existing) {
      throw new ConflictException('Danh mục này đã tồn tại');
    }
    return this.categoryModel.create({ name });
  }

  async findAll() {
    return this.categoryModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string) {
    return this.categoryModel.findById(id).exec();
  }

  async delete(id: string) {
    return this.categoryModel.findByIdAndDelete(id);
  }
}
