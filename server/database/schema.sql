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
  color VARCHAR(7) DEFAULT '#3B82F6',
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

-- Criação da tabela suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  document_type ENUM('CPF', 'CNPJ') NOT NULL,
  document_number VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criação da tabela transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_id INT NOT NULL,
  category_id INT,
  type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  supplier_id INT,
  fixed_account_id INT,
  investment_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (investment_id) REFERENCES investments(id)
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

-- Criação da tabela fixed_accounts
CREATE TABLE IF NOT EXISTS fixed_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  periodicity ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  category_id INT NOT NULL,
  supplier_id INT,
  payment_method ENUM('card', 'boleto', 'automatic_debit'),
  observations TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  reminder_days INT NOT NULL DEFAULT 3,
  next_due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Criação da tabela investments
CREATE TABLE IF NOT EXISTS investments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  investment_type ENUM('acoes', 'fundos', 'tesouro', 'cdb', 'criptomoedas', 'outros') NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  invested_amount DECIMAL(10, 2) NOT NULL,
  current_value DECIMAL(10, 2),
  purchase_date DATE NOT NULL,
  sale_date DATE,
  quantity DECIMAL(10, 4),
  unit_price DECIMAL(10, 2),
  current_unit_price DECIMAL(10, 2),
  broker VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criação da tabela investment_goals
CREATE TABLE IF NOT EXISTS investment_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  target_date DATE,
  description TEXT,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criação da tabela investment_contributions
CREATE TABLE IF NOT EXISTS investment_contributions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  investment_goal_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  contribution_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (investment_goal_id) REFERENCES investment_goals(id)
);

-- Criação da tabela creditors
CREATE TABLE IF NOT EXISTS creditors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  document_type ENUM('CPF', 'CNPJ') NOT NULL,
  document_number VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(255),
  address TEXT,
  contact_person VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criação da tabela financings
CREATE TABLE IF NOT EXISTS financings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  creditor_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  remaining_amount DECIMAL(10, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  payment_day INT NOT NULL,
  payment_method ENUM('boleto', 'automatic_debit', 'transfer') NOT NULL,
  status ENUM('active', 'paid', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (creditor_id) REFERENCES creditors(id)
);

-- Criação da tabela financing_payments
CREATE TABLE IF NOT EXISTS financing_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  financing_id INT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  principal_amount DECIMAL(10, 2) NOT NULL,
  interest_amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('boleto', 'automatic_debit', 'transfer') NOT NULL,
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (financing_id) REFERENCES financings(id)
);

-- Criação da tabela payables
CREATE TABLE IF NOT EXISTS payables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  supplier_id INT NOT NULL,
  category_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  payment_method ENUM('boleto', 'transfer', 'card') NOT NULL,
  invoice_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
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

-- Tabela de execuções de jobs
CREATE TABLE IF NOT EXISTS job_executions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_name VARCHAR(255) NOT NULL,
  status ENUM('running', 'completed', 'failed') NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  error_message TEXT,
  execution_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX idx_suppliers_document ON suppliers(document_type, document_number);

CREATE INDEX idx_receivables_user_id ON receivables(user_id);
CREATE INDEX idx_receivables_customer_id ON receivables(customer_id);
CREATE INDEX idx_receivables_category_id ON receivables(category_id);
CREATE INDEX idx_receivables_due_date ON receivables(due_date);
CREATE INDEX idx_receivables_status ON receivables(status);

CREATE INDEX idx_receivable_payments_receivable_id ON payments(receivable_id);
CREATE INDEX idx_receivable_payments_payment_date ON payments(payment_date);

CREATE INDEX idx_fixed_accounts_user_id ON fixed_accounts(user_id);
CREATE INDEX idx_fixed_accounts_category_id ON fixed_accounts(category_id);
CREATE INDEX idx_fixed_accounts_supplier_id ON fixed_accounts(supplier_id);
CREATE INDEX idx_fixed_accounts_next_due_date ON fixed_accounts(next_due_date);

CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_type ON investments(investment_type);
CREATE INDEX idx_investments_asset_name ON investments(asset_name);

CREATE INDEX idx_investment_goals_user_id ON investment_goals(user_id);
CREATE INDEX idx_investment_goals_status ON investment_goals(status);

CREATE INDEX idx_investment_contributions_user_id ON investment_contributions(user_id);
CREATE INDEX idx_investment_contributions_goal_id ON investment_contributions(investment_goal_id);

CREATE INDEX idx_creditors_user_id ON creditors(user_id);
CREATE INDEX idx_creditors_document ON creditors(document_type, document_number);

CREATE INDEX idx_financings_user_id ON financings(user_id);
CREATE INDEX idx_financings_creditor_id ON financings(creditor_id);
CREATE INDEX idx_financings_status ON financings(status);

CREATE INDEX idx_financing_payments_financing_id ON financing_payments(financing_id);
CREATE INDEX idx_financing_payments_payment_date ON financing_payments(payment_date);
CREATE INDEX idx_financing_payments_status ON financing_payments(status);

CREATE INDEX idx_payables_user_id ON payables(user_id);
CREATE INDEX idx_payables_supplier_id ON payables(supplier_id);
CREATE INDEX idx_payables_category_id ON payables(category_id);
CREATE INDEX idx_payables_due_date ON payables(due_date);
CREATE INDEX idx_payables_status ON payables(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_receivable_id ON notifications(receivable_id);
CREATE INDEX idx_notifications_status ON notifications(status);

CREATE INDEX idx_job_executions_job_name ON job_executions(job_name);
CREATE INDEX idx_job_executions_status ON job_executions(status);
CREATE INDEX idx_job_executions_started_at ON job_executions(started_at); 