const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Platform = require('../models/Platform');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venivicibuy');
  console.log('Connected to MongoDB');

  // Create admin user
  const existingAdmin = await User.findOne({ email: 'admin@venivicibuy.com' });
  if (!existingAdmin) {
    await User.create({ email: 'admin@venivicibuy.com', password: 'admin123', name: 'Admin', role: 'admin' });
    console.log('Admin user created');
  }

  // Create platforms
  const platforms = [
    { name: 'Trendyol', slug: 'trendyol', website: 'https://www.trendyol.com', color: '#F27A1A' },
    { name: 'Hepsiburada', slug: 'hepsiburada', website: 'https://www.hepsiburada.com', color: '#FF6000' },
    { name: 'N11', slug: 'n11', website: 'https://www.n11.com', color: '#7B2D8E' },
    { name: 'Amazon TR', slug: 'amazon-tr', website: 'https://www.amazon.com.tr', color: '#FF9900' },
    { name: 'GittiGidiyor', slug: 'gittigidiyor', website: 'https://www.gittigidiyor.com', color: '#4B0082' },
    { name: 'Çiçeksepeti', slug: 'ciceksepeti', website: 'https://www.ciceksepeti.com', color: '#E91E63' },
    { name: 'Morhipo', slug: 'morhipo', website: 'https://www.morhipo.com', color: '#00BCD4' },
    { name: 'BoynerEvde', slug: 'boynerevde', website: 'https://www.boyner.com.tr', color: '#000000' },
  ];

  for (const p of platforms) {
    await Platform.findOneAndUpdate({ slug: p.slug }, p, { upsert: true });
  }
  console.log('Platforms created');

  // Create categories
  const categories = [
    { name: 'Elektronik', slug: 'elektronik', icon: 'smartphone', order: 1 },
    { name: 'Moda', slug: 'moda', icon: 'shirt', order: 2 },
    { name: 'Ev & Yaşam', slug: 'ev-yasam', icon: 'home', order: 3 },
    { name: 'Spor & Outdoor', slug: 'spor-outdoor', icon: 'dumbbell', order: 4 },
    { name: 'Kozmetik', slug: 'kozmetik', icon: 'sparkles', order: 5 },
    { name: 'Kitap & Hobi', slug: 'kitap-hobi', icon: 'book-open', order: 6 },
    { name: 'Anne & Bebek', slug: 'anne-bebek', icon: 'baby', order: 7 },
    { name: 'Süpermarket', slug: 'supermarket', icon: 'shopping-cart', order: 8 },
    { name: 'Oyun & Konsol', slug: 'oyun-konsol', icon: 'gamepad-2', order: 9 },
    { name: 'Otomotiv', slug: 'otomotiv', icon: 'car', order: 10 },
  ];

  for (const c of categories) {
    await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true });
  }
  console.log('Categories created');

  console.log('Seed completed');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
