import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// import module bạn sẽ tạo
import { AdminModule } from './admin/admin.module';
import { BookModule } from './book/book.module';
import { UserModule } from './user/user.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './auth/auth.module';
import { AuditLogModule } from './audit-log/audit-log.module';

@Module({
  imports: [
    // đọc file .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // kết nối MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),

    // module của bạn
    AdminModule,
    BookModule,
    UserModule,
    CategoryModule,
    AuthModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
