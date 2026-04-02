import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AdminSchema } from '../admin/admin.schema';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/library');

  const Admin = mongoose.model('Admin', AdminSchema);

  const existed = await Admin.findOne({ email: 'admin@gmail.com' });

  if (existed) {
    console.log('Admin đã tồn tại');
    return;
  }

  const hash = await bcrypt.hash('123456', 10);

  await Admin.create({
    email: 'admin@gmail.com',
    password: hash,
  });

  console.log('Tạo admin thành công');
  process.exit();
}

run();
