const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

async function setupDatabase() {
  const sequelize = new Sequelize(config.development);
  
  try {
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    // Comandos SQL na ordem correta (sem dependências circulares)
    const commands = [
      // 1. Criar tabela users (sem dependências)
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        two_factor_secret VARCHAR(255),
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // 2. Criar tabela categories (depende de users)
      `CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      // 3. Criar tabela accounts (depende de users)
      `CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        account_type VARCHAR(255) NOT NULL,
        balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      // 4. Criar tabela customers (depende de users)
      `CREATE TABLE IF NOT EXISTS customers (
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
      )`,
      
      // 5. Criar tabela transactions (depende de users, accounts, categories)
      `CREATE TABLE IF NOT EXISTS transactions (
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
      )`,
      
      // 6. Criar tabela receivables (depende de users, customers, categories)
      `CREATE TABLE IF NOT EXISTS receivables (
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
      )`,
      
      // 7. Criar tabela payments (depende de receivables)
      `CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        receivable_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date TIMESTAMP NOT NULL,
        payment_method VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (receivable_id) REFERENCES receivables(id)
      )`,
      
      // 8. Criar tabela notifications (depende de users, customers, receivables)
      `CREATE TABLE IF NOT EXISTS notifications (
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
      )`,
      
      // 9. Criar tabela SequelizeMeta
      `CREATE TABLE IF NOT EXISTS SequelizeMeta (
        name VARCHAR(255) PRIMARY KEY
      )`
    ];
    
    // Executar cada comando na ordem
    for (const command of commands) {
      await sequelize.query(command);
      console.log('✅ Tabela criada/verificada');
    }
    
    console.log('✅ Schema SQL executado com sucesso');
    
    // Executar as migrations
    const { execSync } = require('child_process');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    console.log('✅ Migrations executadas com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupDatabase(); 