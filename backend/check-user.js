const mysql = require('mysql2/promise');

const USER_EMAIL = 'nextboost53@gmail.com';

async function checkUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '193.203.175.226',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'u560058480_spectrajul',
    password: process.env.DB_PASSWORD || 'W6c!a4En>',
    database: process.env.DB_DATABASE || 'u560058480_spectrajul',
  });

  try {
    console.log('Connected to database');

    const [users] = await connection.execute(
      'SELECT id, email, name, role, tenantId, isActive FROM users WHERE email = ?',
      [USER_EMAIL]
    );

    if (users.length === 0) {
      console.log(`User with email ${USER_EMAIL} not found!`);
      return;
    }

    const user = users[0];
    console.log('User found:', user);

    // Check if there are any tenants
    const [tenants] = await connection.execute('SELECT * FROM tenants LIMIT 5');
    console.log('\nAvailable tenants:', tenants);

  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await connection.end();
  }
}

checkUser();
