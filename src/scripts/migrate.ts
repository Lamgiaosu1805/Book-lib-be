import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library';

async function migrate() {
  console.log('🔌 Kết nối MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Đã kết nối\n');

  const db = mongoose.connection.db!;

  // ─── BOOKS ───────────────────────────────────────────────
  console.log('📚 Migration bảng books...');
  const booksResult = await db.collection('books').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  console.log(`   ✅ ${booksResult.modifiedCount} sách đã được cập nhật isDeleted=false\n`);

  // ─── CATEGORIES ──────────────────────────────────────────
  console.log('🏷️  Migration bảng categories...');
  const catResult = await db.collection('categories').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  console.log(`   ✅ ${catResult.modifiedCount} danh mục đã được cập nhật isDeleted=false\n`);

  // ─── ADMINS ──────────────────────────────────────────────
  console.log('🔐 Migration bảng admins...');
  const adminDeletedResult = await db.collection('admins').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  const adminSuperResult = await db.collection('admins').updateMany(
    { isSuperAdmin: { $exists: false } },
    { $set: { isSuperAdmin: false } },
  );
  const adminNameResult = await db.collection('admins').updateMany(
    { displayName: { $exists: false } },
    { $set: { displayName: '', saintName: '' } },
  );
  console.log(`   ✅ ${adminDeletedResult.modifiedCount} admin cập nhật isDeleted=false`);
  console.log(`   ✅ ${adminSuperResult.modifiedCount} admin cập nhật isSuperAdmin=false`);
  console.log(`   ✅ ${adminNameResult.modifiedCount} admin cập nhật displayName/saintName=''\n`);

  // ─── USERS ───────────────────────────────────────────────
  console.log('👤 Migration bảng users...');
  const usersResult = await db.collection('users').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  const usersGoogleResult = await db.collection('users').updateMany(
    { googleId: { $exists: false } },
    { $set: { googleId: null } },
  );
  const usersNameResult = await db.collection('users').updateMany(
    { displayName: { $exists: false } },
    { $set: { displayName: '' } },
  );
  console.log(`   ✅ ${usersResult.modifiedCount} user cập nhật isDeleted=false`);
  console.log(`   ✅ ${usersGoogleResult.modifiedCount} user cập nhật googleId=null`);
  console.log(`   ✅ ${usersNameResult.modifiedCount} user cập nhật displayName=''\n`);

  // ─── TỔNG KẾT ────────────────────────────────────────────
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
