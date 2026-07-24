const mysql = require('mysql2/promise');

async function migratePaymentFields() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '193.203.175.226',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'u560058480_spectrajul',
    password: process.env.DB_PASSWORD || 'W6c!a4En>',
    database: process.env.DB_DATABASE || 'u560058480_spectrajul',
  });

  try {
    console.log('Connected to database');

    const fields = [
      { name: 'firstPaymentDate', type: 'DATE', definition: 'firstPaymentDate DATE NULL' },
      { name: 'paymentFrequency', type: 'INT', definition: 'paymentFrequency INT NULL' },
      { name: 'paymentNotes', type: 'TEXT', definition: 'paymentNotes TEXT NULL' },
    ];

    for (const field of fields) {
      console.log(`Checking ${field.name}...`);
      const [columns] = await connection.execute(
        `SHOW COLUMNS FROM contracts LIKE '${field.name}'`
      );

      if (columns.length === 0) {
        await connection.execute(`ALTER TABLE contracts ADD COLUMN ${field.definition}`);
        console.log(`Added ${field.name} column`);
      } else {
        console.log(`${field.name} column already exists`);
      }
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Error migrating payment fields:', error);
  } finally {
    await connection.end();
  }
}

migratePaymentFields();
