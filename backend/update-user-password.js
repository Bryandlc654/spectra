const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const USER_EMAIL = 'nextboost53@gmail.com';
const NEW_PASSWORD = 'Admin123!';

async function updateUserPassword() {
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
      [USER_EMAIL]
    );

    if (existing.length === 0) {
      console.log(`User with email ${USER_EMAIL} not found!`);
      return;
    }

    console.log(`User found, updating password...`);
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, USER_EMAIL]
    );
    console.log(`Password updated successfully for ${USER_EMAIL}`);
    console.log(`New password: ${NEW_PASSWORD}`);
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await connection.end();
  }
}

updateUserPassword();
