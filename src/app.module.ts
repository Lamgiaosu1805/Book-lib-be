import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// import module bạn sẽ tạo
import { AdminModule } from './admin/admin.module';
import { BookModule } from './book/book.module';

@Module({
  imports: [
    // đọc file .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // kết nối MongoDB
    MongooseModule.forRoot('mongodb://localhost:27017/library'),

    // module của bạn
    AdminModule,
    BookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
