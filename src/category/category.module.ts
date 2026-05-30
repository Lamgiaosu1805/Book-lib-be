import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category, CategorySchema } from './category.schema';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
    AuditLogModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
