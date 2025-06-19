-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS finance;
USE finance;

-- Criação da tabela users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  two_factor_secret VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criação da tabela categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criação da tabela accounts
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(255) NOT NULL,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criação da tabela transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_id INT NOT NULL,
  category_id INT NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Criação da tabela receivables
CREATE TABLE IF NOT EXISTS receivables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_id INT NOT NULL,
  category_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  remaining_amount DECIMAL(10, 2) NOT NULL,
  due_date TIMESTAMP NOT NULL,
  description TEXT,
  invoice_number VARCHAR(255),
  payment_terms TEXT,
  status ENUM('pending', 'partially_paid', 'paid') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Criação da tabela payments
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receivable_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  payment_method VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (receivable_id) REFERENCES receivables(id)
);

-- Criação da tabela customers
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(255),
  document VARCHAR(255),
  document_type ENUM('CPF', 'CNPJ'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  customer_id INT NOT NULL,
  receivable_id INT NOT NULL,
  type ENUM('email', 'sms') NOT NULL,
  status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (receivable_id) REFERENCES receivables(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `SequelizeMeta` (
  name VARCHAR(255) PRIMARY KEY
);

-- Índices para melhorar a performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_document ON customers(document_type, document);

CREATE INDEX idx_receivables_user_id ON receivables(user_id);
CREATE INDEX idx_receivables_customer_id ON receivables(customer_id);
CREATE INDEX idx_receivables_category_id ON receivables(category_id);
CREATE INDEX idx_receivables_due_date ON receivables(due_date);
CREATE INDEX idx_receivables_status ON receivables(status);

CREATE INDEX idx_receivable_payments_receivable_id ON payments(receivable_id);
CREATE INDEX idx_receivable_payments_payment_date ON payments(payment_date);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_receivable_id ON notifications(receivable_id);
CREATE INDEX idx_notifications_status ON notifications(status); 