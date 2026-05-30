import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library';

const col = (name: string) => mongoose.connection.collection(name);

async function migrate() {
  console.log('🔌 Kết nối MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Đã kết nối\n');

  // ─── BOOKS ───────────────────────────────────────────────
  console.log('📚 Migration bảng books...');
  const books = await col('books').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  console.log(`   ✅ ${books.modifiedCount} sách cập nhật isDeleted=false\n`);

  // ─── CATEGORIES ──────────────────────────────────────────
  console.log('🏷️  Migration bảng categories...');
  const cats = await col('categories').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  console.log(`   ✅ ${cats.modifiedCount} danh mục cập nhật isDeleted=false\n`);

  // ─── ADMINS ──────────────────────────────────────────────
  console.log('🔐 Migration bảng admins...');
  const a1 = await col('admins').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  const a2 = await col('admins').updateMany(
    { isSuperAdmin: { $exists: false } },
    { $set: { isSuperAdmin: false } },
  );
  const a3 = await col('admins').updateMany(
    { displayName: { $exists: false } },
    { $set: { displayName: '', saintName: '' } },
  );
  console.log(`   ✅ ${a1.modifiedCount} admin cập nhật isDeleted=false`);
  console.log(`   ✅ ${a2.modifiedCount} admin cập nhật isSuperAdmin=false`);
  console.log(`   ✅ ${a3.modifiedCount} admin cập nhật displayName/saintName=''\n`);

  // ─── USERS ───────────────────────────────────────────────
  console.log('👤 Migration bảng users...');
  const u1 = await col('users').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  const u2 = await col('users').updateMany(
    { googleId: { $exists: false } },
    { $set: { googleId: null } },
  );
  const u3 = await col('users').updateMany(
    { displayName: { $exists: false } },
    { $set: { displayName: '' } },
  );
  console.log(`   ✅ ${u1.modifiedCount} user cập nhật isDeleted=false`);
  console.log(`   ✅ ${u2.modifiedCount} user cập nhật googleId=null`);
  console.log(`   ✅ ${u3.modifiedCount} user cập nhật displayName=''\n`);

  console.log('─'.repeat(40));
  console.log('🎉 Migration hoàn tất!');
  console.log('─'.repeat(40));

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration thất bại:', err);
  process.exit(1);
});
