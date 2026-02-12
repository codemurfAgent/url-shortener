// 🗄️ Database Setup Script
// Run this script to initialize the PostgreSQL database

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/urlshortener'
});

async function setupDatabase() {
  console.log('🔧 Setting up URL Shortener database...');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Create URLs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        original_url TEXT NOT NULL,
        short_code VARCHAR(10) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        clicks INTEGER DEFAULT 0
      );
    `);
    console.log('✅ URLs table created');

    // Create Analytics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        url_id UUID REFERENCES urls(id) ON DELETE CASCADE,
        ip_address INET,
        user_agent TEXT,
        referer TEXT,
        country VARCHAR(2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Analytics table created');

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
    `);
    console.log('✅ Short code index created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_url_id ON analytics(url_id);
    `);
    console.log('✅ Analytics URL index created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
    `);
    console.log('✅ Analytics timestamp index created');

    // Insert sample data (optional)
    const sampleExists = await pool.query('SELECT COUNT(*) FROM urls');
    if (parseInt(sampleExists.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO urls (original_url, short_code) VALUES 
        ('https://github.com', 'github'),
        ('https://google.com', 'google'),
        ('https://vercel.com', 'vercel');
      `);
      console.log('✅ Sample data inserted');
    }

    console.log('🎉 Database setup complete!');
    console.log('\n📊 Database Info:');
    
    const urlCount = await pool.query('SELECT COUNT(*) FROM urls');
    const analyticsCount = await pool.query('SELECT COUNT(*) FROM analytics');
    
    console.log(`- URLs: ${urlCount.rows[0].count}`);
    console.log(`- Analytics records: ${analyticsCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Check DATABASE_URL environment variable');
    console.log('3. Verify database exists and permissions');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase();