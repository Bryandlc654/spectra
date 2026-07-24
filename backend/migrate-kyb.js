const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrateKyb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '193.203.175.226',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'u560058480_spectrajul',
    password: process.env.DB_PASSWORD || 'W6c!a4En>',
    database: process.env.DB_DATABASE || 'u560058480_spectrajul',
  });

  try {
    console.log('Connected to database');

    // 1. Add tenantId column to contract_templates if not exists
    console.log('Checking tenantId column in contract_templates...');
    const [templateColumns] = await connection.execute(
      "SHOW COLUMNS FROM contract_templates LIKE 'tenantId'"
    );

    if (templateColumns.length === 0) {
      await connection.execute(
        "ALTER TABLE contract_templates ADD COLUMN tenantId INT NULL"
      );
      console.log('tenantId column added to contract_templates');
    } else {
      console.log('tenantId column already exists');
    }

    // 2. Add index for tenantId
    const [templateIndexes] = await connection.execute(
      "SHOW INDEX FROM contract_templates WHERE Key_name = 'IDX_tenantId'"
    );
    if (templateIndexes.length === 0) {
      await connection.execute(
        "CREATE INDEX IDX_tenantId ON contract_templates(tenantId)"
      );
      console.log('Index IDX_tenantId added to contract_templates');
    }

    // 3. Create kyb_requests table if not exists
    console.log('Creating kyb_requests table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS kyb_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenantId INT NOT NULL,
        status ENUM('pending','approved','rejected') DEFAULT 'pending',
        adminNotes TEXT NULL,
        createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX idx_tenantId (tenantId),
        INDEX idx_status (status)
      )
    `);
    console.log('kyb_requests table created');

    // 4. Create kyb_documents table if not exists
    console.log('Creating kyb_documents table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS kyb_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kybRequestId INT NOT NULL,
        type VARCHAR(255) NOT NULL,
        originalName VARCHAR(255) NOT NULL,
        filePath VARCHAR(500) NOT NULL,
        mimeType VARCHAR(255) NOT NULL,
        createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_kybRequestId (kybRequestId),
        FOREIGN KEY (kybRequestId) REFERENCES kyb_requests(id) ON DELETE CASCADE
      )
    `);
    console.log('kyb_documents table created');

    // 5. Add kybRequestId column to tenants if not exists
    console.log('Checking kybRequestId column in tenants...');
    const [tenantColumns] = await connection.execute(
      "SHOW COLUMNS FROM tenants LIKE 'kybRequestId'"
    );

    if (tenantColumns.length === 0) {
      await connection.execute(
        "ALTER TABLE tenants ADD COLUMN kybRequestId INT NULL"
      );
      console.log('kybRequestId column added to tenants');
    } else {
      console.log('kybRequestId column already exists');
    }

    console.log('Migration complete!');

  } catch (error) {
    console.error('Error migrating KYB:', error);
  } finally {
    await connection.end();
  }
}

migrateKyb();
