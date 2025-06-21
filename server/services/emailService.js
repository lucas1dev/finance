/**
 * Serviço de email para alertas automáticos.
 * Envia notificações por email para administradores em caso de falhas críticas.
 * 
 * @module services/emailService
 */

const nodemailer = require('nodemailer');
const { User } = require('../models');
const { logger } = require('../utils/logger');

/**
 * Configuração do transporter de email.
 * Usa variáveis de ambiente para configuração.
 */
let transporter = null;

/**
 * Inicializa o transporter de email.
 * @returns {Promise<void>}
 */
async function initializeEmailService() {
  try {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // Verificar se as credenciais estão configuradas
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      logger.warn('Configurações de email não encontradas. Alertas por email desabilitados.');
      return;
    }

    transporter = nodemailer.createTransport(emailConfig);

    // Testar conexão
    await transporter.verify();
    logger.info('Serviço de email inicializado com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar serviço de email:', error);
    transporter = null;
  }
}

/**
 * Envia email de alerta para administradores.
 * @param {string} subject - Assunto do email.
 * @param {string} message - Mensagem do email.
 * @param {Object} metadata - Metadados adicionais (opcional).
 * @returns {Promise<boolean>} True se enviado com sucesso.
 */
async function sendAlertEmail(subject, message, metadata = {}) {
  try {
    if (!transporter) {
      logger.warn('Transporter de email não inicializado. Email não enviado.');
      return false;
    }

    // Buscar administradores
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'name', 'email']
    });

    if (admins.length === 0) {
      logger.warn('Nenhum administrador encontrado para envio de alerta.');
      return false;
    }

    const adminEmails = admins.map(admin => admin.email).filter(Boolean);

    if (adminEmails.length === 0) {
      logger.warn('Nenhum email de administrador válido encontrado.');
      return false;
    }

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          <h2 style="color: #dc3545; margin: 0 0 20px 0;">🚨 Alerta do Sistema Financeiro</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid #dc3545;">
            <h3 style="margin: 0 0 15px 0; color: #333;">${subject}</h3>
            <p style="margin: 0 0 15px 0; line-height: 1.6; color: #555;">${message}</p>
            
            ${Object.keys(metadata).length > 0 ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 3px; margin-top: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Detalhes Técnicos:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #666;">
                  ${Object.entries(metadata).map(([key, value]) => 
                    `<li><strong>${key}:</strong> ${value}</li>`
                  ).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
            <p>Este é um alerta automático do Sistema Financeiro.</p>
            <p>Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Sistema Financeiro" <${process.env.SMTP_USER}>`,
      to: adminEmails.join(', '),
      subject: `[ALERTA] ${subject}`,
      html: htmlMessage,
    };

    const result = await transporter.sendMail(mailOptions);
    
    logger.info(`Email de alerta enviado com sucesso para ${adminEmails.length} administrador(es)`, {
      messageId: result.messageId,
      subject,
      recipients: adminEmails
    });

    return true;
  } catch (error) {
    logger.error('Erro ao enviar email de alerta:', error);
    return false;
  }
}

/**
 * Envia alerta específico para falha de job.
 * @param {string} jobName - Nome do job que falhou.
 * @param {Error} error - Erro ocorrido.
 * @param {Object} executionData - Dados da execução.
 * @returns {Promise<boolean>} True se enviado com sucesso.
 */
async function sendJobFailureAlert(jobName, error, executionData = {}) {
  const subject = `Falha no Job: ${jobName}`;
  
  const message = `
    O job <strong>${jobName}</strong> falhou durante sua execução.
    
    <strong>Erro:</strong> ${error.message}
    
    Esta falha pode impactar o funcionamento normal do sistema de notificações.
    Recomenda-se verificar os logs e investigar a causa raiz do problema.
  `;

  const metadata = {
    'Job': jobName,
    'Status': 'Falha',
    'Data/Hora': new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    'Duração': executionData.duration ? `${executionData.duration}ms` : 'N/A',
    'Stack Trace': error.stack ? error.stack.substring(0, 500) + '...' : 'N/A'
  };

  return await sendAlertEmail(subject, message, metadata);
}

/**
 * Envia alerta para múltiplas falhas consecutivas.
 * @param {string} jobName - Nome do job.
 * @param {number} failureCount - Número de falhas consecutivas.
 * @param {Array} recentErrors - Lista dos erros recentes.
 * @returns {Promise<boolean>} True se enviado com sucesso.
 */
async function sendConsecutiveFailureAlert(jobName, failureCount, recentErrors = []) {
  const subject = `Múltiplas Falhas Consecutivas: ${jobName}`;
  
  const message = `
    O job <strong>${jobName}</strong> falhou <strong>${failureCount} vezes consecutivas</strong>.
    
    Este padrão de falhas indica um problema persistente que requer atenção imediata.
    Recomenda-se:
    <ul>
      <li>Verificar a conectividade com o banco de dados</li>
      <li>Analisar os logs de erro detalhadamente</li>
      <li>Verificar se há mudanças recentes na configuração</li>
      <li>Considerar pausar temporariamente o job se necessário</li>
    </ul>
  `;

  const metadata = {
    'Job': jobName,
    'Falhas Consecutivas': failureCount,
    'Última Falha': new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    'Erros Recentes': recentErrors.length > 0 ? recentErrors.slice(-3).join('; ') : 'N/A'
  };

  return await sendAlertEmail(subject, message, metadata);
}

/**
 * Envia alerta para problemas de conectividade.
 * @param {string} service - Nome do serviço com problema.
 * @param {Error} error - Erro de conectividade.
 * @returns {Promise<boolean>} True se enviado com sucesso.
 */
async function sendConnectivityAlert(service, error) {
  const subject = `Problema de Conectividade: ${service}`;
  
  const message = `
    Detectado problema de conectividade com o serviço <strong>${service}</strong>.
    
    <strong>Erro:</strong> ${error.message}
    
    Este problema pode afetar o funcionamento normal do sistema.
    Verifique a conectividade de rede e a disponibilidade do serviço.
  `;

  const metadata = {
    'Serviço': service,
    'Status': 'Conectividade Falhou',
    'Data/Hora': new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    'Erro': error.message
  };

  return await sendAlertEmail(subject, message, metadata);
}

/**
 * Envia alerta para problemas de integridade de dados.
 * @param {Object} integrityReport - Relatório de integridade.
 * @returns {Promise<boolean>} True se enviado com sucesso.
 */
async function sendIntegrityAlert(integrityReport) {
  const { totalIssues, criticalIssues, autoFixed, issues, summary } = integrityReport;
  
  const subject = `Problemas de Integridade Detectados: ${totalIssues} problemas`;
  
  const severityColor = criticalIssues > 0 ? '#dc3545' : totalIssues > 10 ? '#ffc107' : '#28a745';
  const severityText = criticalIssues > 0 ? 'CRÍTICO' : totalIssues > 10 ? 'ALTO' : 'BAIXO';
  
  const message = `
    <div style="color: ${severityColor}; font-weight: bold; margin-bottom: 15px;">
      Nível de Severidade: ${severityText}
    </div>
    
    Foram detectados <strong>${totalIssues} problemas de integridade</strong> no sistema.
    
    <strong>Resumo:</strong>
    <ul>
      <li>Problemas críticos: ${criticalIssues}</li>
      <li>Correções automáticas aplicadas: ${autoFixed}</li>
      <li>Notificações órfãs: ${summary.orphaned_notifications || 0}</li>
      <li>Notificações duplicadas: ${summary.duplicate_notifications || 0}</li>
      <li>Notificações inconsistentes: ${summary.inconsistent_notifications || 0}</li>
      <li>Transações órfãs: ${summary.orphaned_transactions || 0}</li>
    </ul>
    
    ${criticalIssues > 0 ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 3px; margin: 15px 0;">
        <strong>⚠️ ATENÇÃO:</strong> Existem ${criticalIssues} problemas críticos que requerem intervenção manual.
      </div>
    ` : ''}
    
    ${autoFixed > 0 ? `
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 10px; border-radius: 3px; margin: 15px 0;">
        <strong>✅ Correções Automáticas:</strong> ${autoFixed} problemas foram corrigidos automaticamente.
      </div>
    ` : ''}
  `;

  const metadata = {
    'Total de Problemas': totalIssues,
    'Problemas Críticos': criticalIssues,
    'Correções Automáticas': autoFixed,
    'Data da Verificação': integrityReport.timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  };

  return await sendAlertEmail(subject, message, metadata);
}

/**
 * Envia email de teste para validar configuração.
 * @param {string} testEmail - Email para envio do teste.
 * @returns {Promise<boolean>} True se enviado com sucesso.
 */
async function sendTestEmail(testEmail) {
  const subject = 'Teste de Configuração - Sistema Financeiro';
  
  const message = `
    Este é um email de teste para validar a configuração do sistema de alertas.
    
    Se você recebeu este email, significa que:
    <ul>
      <li>✅ O serviço de email está configurado corretamente</li>
      <li>✅ As credenciais SMTP estão válidas</li>
      <li>✅ O sistema pode enviar alertas automáticos</li>
    </ul>
    
    <strong>Data/Hora do teste:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
  `;

  const metadata = {
    'Tipo': 'Teste de Configuração',
    'Status': 'Sucesso',
    'Destinatário': testEmail
  };

  try {
    if (!transporter) {
      throw new Error('Transporter de email não inicializado');
    }

    const mailOptions = {
      from: `"Sistema Financeiro" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #28a745; margin: 0 0 20px 0;">✅ Teste de Configuração</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745;">
              <h3 style="margin: 0 0 15px 0; color: #333;">${subject}</h3>
              <div style="margin: 0 0 15px 0; line-height: 1.6; color: #555;">${message}</div>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 3px; margin-top: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Detalhes:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #666;">
                  ${Object.entries(metadata).map(([key, value]) => 
                    `<li><strong>${key}:</strong> ${value}</li>`
                  ).join('')}
                </ul>
              </div>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              <p>Este é um email de teste do Sistema Financeiro.</p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    logger.info(`Email de teste enviado com sucesso para ${testEmail}`, {
      messageId: result.messageId
    });

    return true;
  } catch (error) {
    logger.error('Erro ao enviar email de teste:', error);
    return false;
  }
}

module.exports = {
  initializeEmailService,
  sendAlertEmail,
  sendJobFailureAlert,
  sendConsecutiveFailureAlert,
  sendConnectivityAlert,
  sendIntegrityAlert,
  sendTestEmail
}; 