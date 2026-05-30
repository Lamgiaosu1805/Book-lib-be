import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library';

async function migrate() {
  console.log('🔌 Kết nối MongoDB...');
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  // Lấy tên database từ URI
  const dbName = new URL(MONGO_URI.replace('mongodb://', 'http://')).pathname.slice(1).split('?')[0];
  const db = client.db(dbName);
  console.log(`✅ Đã kết nối database: "${dbName}"\n`);

  // ─── BOOKS ───────────────────────────────────────────────
  console.log('📚 Migration bảng books...');
  const books = await db.collection('books').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  console.log(`   ✅ ${books.modifiedCount} sách cập nhật isDeleted=false\n`);

  // ─── CATEGORIES ──────────────────────────────────────────
  console.log('🏷️  Migration bảng categories...');
  const cats = await db.collection('categories').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  console.log(`   ✅ ${cats.modifiedCount} danh mục cập nhật isDeleted=false\n`);

  // ─── ADMINS ──────────────────────────────────────────────
  console.log('🔐 Migration bảng admins...');
  const a1 = await db.collection('admins').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  const a2 = await db.collection('admins').updateMany(
    { isSuperAdmin: { $exists: false } },
    { $set: { isSuperAdmin: false } },
  );
  const a3 = await db.collection('admins').updateMany(
    { displayName: { $exists: false } },
    { $set: { displayName: '', saintName: '' } },
  );
  console.log(`   ✅ ${a1.modifiedCount} admin cập nhật isDeleted=false`);
  console.log(`   ✅ ${a2.modifiedCount} admin cập nhật isSuperAdmin=false`);
  console.log(`   ✅ ${a3.modifiedCount} admin cập nhật displayName/saintName=''\n`);

  // ─── USERS ───────────────────────────────────────────────
  console.log('👤 Migration bảng users...');
  const u1 = await db.collection('users').updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  const u2 = await db.collection('users').updateMany(
    { googleId: { $exists: false } },
    { $set: { googleId: null } },
  );
  const u3 = await db.collection('users').updateMany(
    { displayName: { $exists: false } },
    { $set: { displayName: '' } },
  );
  console.log(`   ✅ ${u1.modifiedCount} user cập nhật isDeleted=false`);
  console.log(`   ✅ ${u2.modifiedCount} user cập nhật googleId=null`);
  console.log(`   ✅ ${u3.modifiedCount} user cập nhật displayName=''\n`);

  console.log('─'.repeat(40));
  console.log('🎉 Migration hoàn tất!');
  console.log('─'.repeat(40));

  await client.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration thất bại:', err);
  process.exit(1);
});
