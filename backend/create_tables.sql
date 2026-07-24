CREATE TABLE IF NOT EXISTS contract_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  isActive TINYINT(1) DEFAULT 1,
  createdByUserId INT NULL,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  templateId INT NULL,
  tenantUserId INT NOT NULL,
  tenantName VARCHAR(255) NULL,
  freelancerUserId INT NOT NULL,
  freelancerName VARCHAR(255) NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status ENUM('draft','sent','signed','cancelled') DEFAULT 'draft',
  startDate DATE NULL,
  endDate DATE NULL,
  amount DECIMAL(10,2) NULL,
  signedAt DATETIME NULL,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS sign_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(255) NULL,
  filePath VARCHAR(500) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  ownerUserId INT NOT NULL,
  status ENUM('draft','sent','completed') DEFAULT 'draft',
  certificateData TEXT NULL,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_owner (ownerUserId)
);

CREATE TABLE IF NOT EXISTS signers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  documentId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'signer',
  signOrder INT DEFAULT 0,
  hasSigned TINYINT(1) DEFAULT 0,
  signedAt DATETIME NULL,
  ipAddress VARCHAR(45) NULL,
  signatureDataUrl TEXT NULL,
  signatureX INT NULL,
  signatureY INT NULL,
  signaturePage INT NULL,
  token VARCHAR(255) NULL UNIQUE,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_doc (documentId),
  FOREIGN KEY (documentId) REFERENCES sign_documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NULL,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS kyb_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  adminNotes TEXT NULL,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_tenant (tenantId),
  INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS kyb_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kybRequestId INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  filePath VARCHAR(500) NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_kyb (kybRequestId),
  FOREIGN KEY (kybRequestId) REFERENCES kyb_requests(id) ON DELETE CASCADE
);

-- Add kybRequestId to tenants if not exists
SET @dbname = DATABASE();
SET @tablename = 'tenants';
SET @columnname = 'kybRequestId';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_schema = @dbname)
      AND (table_name = @tablename)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
