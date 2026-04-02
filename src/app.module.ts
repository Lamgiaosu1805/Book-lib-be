import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// import module bạn sẽ tạo
import { AdminModule } from './admin/admin.module';
import { BookModule } from './book/book.module';
import { UserModule } from './user/user.module';
import { LoggerMiddleware } from './logger/logger.middleware';

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
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
