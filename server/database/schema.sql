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
  active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP NULL,
  last_login_ip VARCHAR(45),
  notification_settings TEXT COMMENT 'JSON string com configurações de notificação do usuário',
  preferences TEXT COMMENT 'JSON string com preferências gerais do usuário',
  timezone VARCHAR(255) DEFAULT 'America/Sao_Paulo',
  language VARCHAR(10) DEFAULT 'pt-BR',
  phone VARCHAR(255),
  avatar_url VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP NULL,
  password_changed_at TIMESTAMP NULL,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criação da tabela user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  refresh_token VARCHAR(500),
  device_type ENUM('desktop', 'mobile', 'tablet', 'unknown') DEFAULT 'unknown',
  device_name VARCHAR(255) COMMENT 'Nome do dispositivo (ex: iPhone 14, MacBook Pro)',
  browser VARCHAR(255) COMMENT 'Nome do navegador (ex: Chrome, Safari, Firefox)',
  os VARCHAR(255) COMMENT 'Sistema operacional (ex: Windows 10, macOS, iOS)',
  user_agent TEXT,
  ip_address VARCHAR(45) COMMENT 'Endereço IP do usuário (suporta IPv6)',
  location VARCHAR(255) COMMENT 'Localização aproximada (ex: São Paulo, Brasil)',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  active BOOLEAN NOT NULL DEFAULT true,
  current BOOLEAN NOT NULL DEFAULT false COMMENT 'Indica se é a sessão atual do usuário',
  last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL COMMENT 'Data de expiração da sessão',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Criação da tabela user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category ENUM('notifications', 'appearance', 'privacy', 'security', 'preferences', 'dashboard', 'reports') NOT NULL COMMENT 'Categoria da configuração',
  settings TEXT NOT NULL DEFAULT '{}' COMMENT 'JSON string com as configurações da categoria',
  version INT DEFAULT 1 COMMENT 'Versão das configurações para controle de mudanças',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY unique_user_category (user_id, category)
);

-- Criação da tabela categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  user_id INT NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_default BOOLEAN NOT NULL DEFAULT false,
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
  end_date DATE NOT NULL,
  payment_day INT NOT NULL,
  payment_frequency ENUM('monthly', 'weekly', 'biweekly') DEFAULT 'monthly',
  status ENUM('active', 'paid', 'cancelled') DEFAULT 'active',
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (creditor_id) REFERENCES creditors(id)
);

-- Criação da tabela financing_payments
CREATE TABLE IF NOT EXISTS financing_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  financing_id INT NOT NULL,
  payment_number INT NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  principal_amount DECIMAL(10, 2) NOT NULL,
  interest_amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE,
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (financing_id) REFERENCES financings(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Criação da tabela payables
CREATE TABLE IF NOT EXISTS payables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  supplier_id INT NOT NULL,
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
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
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
  notes TEXT COMMENT 'Observações adicionais sobre o recebível',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Criação da tabela payments
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receivable_id INT,
  payable_id INT,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  payment_method VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (receivable_id) REFERENCES receivables(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (payable_id) REFERENCES payables(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Criação da tabela fixed_accounts
CREATE TABLE IF NOT EXISTS fixed_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_id INT,
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
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE SET NULL,
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
  FOREIGN KEY (fixed_account_id) REFERENCES fixed_accounts(id),
  FOREIGN KEY (investment_id) REFERENCES investments(id)
);

-- Criação da tabela notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_id INT,
  receivable_id INT,
  type ENUM('payment_reminder', 'overdue_payment', 'system_alert', 'investment_goal') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('unread', 'read', 'archived') DEFAULT 'unread',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  scheduled_for TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (receivable_id) REFERENCES receivables(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Criação da tabela job_executions
CREATE TABLE IF NOT EXISTS job_executions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_name VARCHAR(255) NOT NULL,
  status ENUM('running', 'completed', 'failed', 'cancelled') NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  execution_time_ms INT NULL,
  error_message TEXT NULL,
  result_summary TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criação da tabela audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  userEmail VARCHAR(255) NOT NULL COMMENT 'Email do usuário para facilitar consultas',
  action VARCHAR(100) NOT NULL COMMENT 'Tipo de ação realizada (ex: job_execution, config_change, data_deletion)',
  resource VARCHAR(100) NOT NULL COMMENT 'Recurso afetado (ex: notifications, jobs, users)',
  resourceId INT NULL COMMENT 'ID do recurso específico afetado (se aplicável)',
  details TEXT NULL COMMENT 'Detalhes adicionais da ação em formato JSON',
  ipAddress VARCHAR(45) NULL COMMENT 'Endereço IP do usuário',
  userAgent TEXT NULL COMMENT 'User-Agent do navegador/aplicação',
  status ENUM('success', 'failure', 'partial') NOT NULL DEFAULT 'success' COMMENT 'Status da ação (success, failure, partial)',
  errorMessage TEXT NULL COMMENT 'Mensagem de erro em caso de falha',
  executionTime INT NULL COMMENT 'Tempo de execução em milissegundos',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora da ação',
  FOREIGN KEY (userId) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Criação da tabela SequelizeMeta (para controle de migrações)
CREATE TABLE IF NOT EXISTS `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Índices para otimização de consultas

-- Índices para transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

-- Índices para customers
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_document ON customers(document_type, document);

-- Índices para suppliers
CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX idx_suppliers_document ON suppliers(document_type, document_number);

-- Índices para receivables
CREATE INDEX idx_receivables_user_id ON receivables(user_id);
CREATE INDEX idx_receivables_customer_id ON receivables(customer_id);
CREATE INDEX idx_receivables_category_id ON receivables(category_id);
CREATE INDEX idx_receivables_due_date ON receivables(due_date);
CREATE INDEX idx_receivables_status ON receivables(status);

-- Índices para payments
CREATE INDEX idx_receivable_payments_receivable_id ON payments(receivable_id);
CREATE INDEX idx_receivable_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_payable_id ON payments(payable_id);

-- Índices para fixed_accounts
CREATE INDEX idx_fixed_accounts_user_id ON fixed_accounts(user_id);
CREATE INDEX idx_fixed_accounts_category_id ON fixed_accounts(category_id);
CREATE INDEX idx_fixed_accounts_supplier_id ON fixed_accounts(supplier_id);
CREATE INDEX idx_fixed_accounts_next_due_date ON fixed_accounts(next_due_date);

-- Índices para investments
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_type ON investments(investment_type);
CREATE INDEX idx_investments_asset_name ON investments(asset_name);

-- Índices para investment_goals
CREATE INDEX idx_investment_goals_user_id ON investment_goals(user_id);
CREATE INDEX idx_investment_goals_status ON investment_goals(status);

-- Índices para investment_contributions
CREATE INDEX idx_investment_contributions_user_id ON investment_contributions(user_id);
CREATE INDEX idx_investment_contributions_goal_id ON investment_contributions(investment_goal_id);

-- Índices para creditors
CREATE INDEX idx_creditors_user_id ON creditors(user_id);
CREATE INDEX idx_creditors_document ON creditors(document_type, document_number);

-- Índices para financings
CREATE INDEX idx_financings_user_id ON financings(user_id);
CREATE INDEX idx_financings_creditor_id ON financings(creditor_id);
CREATE INDEX idx_financings_status ON financings(status);

-- Índices para financing_payments
CREATE INDEX idx_financing_payments_financing_id ON financing_payments(financing_id);
CREATE INDEX idx_financing_payments_payment_date ON financing_payments(payment_date);
CREATE INDEX idx_financing_payments_status ON financing_payments(status);

-- Índices para payables
CREATE INDEX idx_payables_user_id ON payables(user_id);
CREATE INDEX idx_payables_supplier_id ON payables(supplier_id);
CREATE INDEX idx_payables_category_id ON payables(category_id);
CREATE INDEX idx_payables_due_date ON payables(due_date);
CREATE INDEX idx_payables_status ON payables(status);

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_receivable_id ON notifications(receivable_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Índices para job_executions
CREATE INDEX idx_job_executions_job_name ON job_executions(job_name);
CREATE INDEX idx_job_executions_status ON job_executions(status);
CREATE INDEX idx_job_executions_started_at ON job_executions(started_at);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(userId);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(createdAt);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(userId, createdAt);

-- Índices para user_sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(active);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Índices para user_settings
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Índices para categories
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_user_default ON categories(user_id, is_default); 