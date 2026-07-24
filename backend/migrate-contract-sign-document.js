const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '193.203.175.226',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'u560058480_spectrajul',
    password: process.env.DB_PASSWORD || 'W6c!a4En>',
    database: process.env.DB_DATABASE || 'u560058480_spectrajul',
  });

  try {
    console.log('Connected to database');

    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM contracts LIKE 'signDocumentId'"
    );

    if (columns.length === 0) {
      await connection.execute(
        "ALTER TABLE contracts ADD COLUMN signDocumentId INT NULL"
      );
      console.log('signDocumentId column added to contracts');
    } else {
      console.log('signDocumentId column already exists');
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Error migrating:', error);
  } finally {
    await connection.end();
  }
}

migrate();
