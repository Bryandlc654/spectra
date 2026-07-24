const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@spectra.com';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_NAME = 'Super Admin';

async function seedSuperAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '193.203.175.226',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'u560058480_spectrajul',
    password: process.env.DB_PASSWORD || 'W6c!a4En>',
    database: process.env.DB_DATABASE || 'u560058480_spectrajul',
  });

  try {
    console.log('Connected to database');

    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [ADMIN_EMAIL]
    );

    if (existing.length > 0) {
      console.log(`Super admin already exists (${ADMIN_EMAIL}), updating password...`);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await connection.execute(
        'UPDATE users SET password = ?, role = ?, isActive = 1 WHERE email = ?',
        [hashedPassword, 'super_admin', ADMIN_EMAIL]
      );
      console.log('Password updated');
    } else {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await connection.execute(
        'INSERT INTO users (email, password, name, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())',
        [ADMIN_EMAIL, hashedPassword, ADMIN_NAME, 'super_admin']
      );
      console.log(`Super admin created: ${ADMIN_EMAIL}`);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error seeding super admin:', error);
  } finally {
    await connection.end();
  }
}

seedSuperAdmin();
