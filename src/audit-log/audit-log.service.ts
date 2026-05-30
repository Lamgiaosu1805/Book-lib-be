import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './audit-log.schema';

export interface Actor {
  id: string;
  name: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLog>,
  ) {}

  async log(
    actor: Actor,
    action: string,
    targetType: string,
    targetId = '',
    targetTitle = '',
    detail = '',
  ) {
    await this.auditLogModel.create({
      adminId: actor.id,
      adminName: actor.name,
      action,
      targetType,
      targetId,
      targetTitle,
      detail,
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.auditLogModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(),
    ]);
    return {
      items: data,
      meta: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }
}
