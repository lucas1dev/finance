# 📧 Configuração do Sistema de Alertas por Email

## Visão Geral

O sistema financeiro inclui um sistema de alertas automáticos por email que notifica administradores quando jobs críticos falham. Este sistema é essencial para monitoramento em produção.

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Configurações de Email (para alertas automáticos)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

### 2. Configuração do Gmail

Para usar o Gmail como servidor SMTP:

1. **Ative a verificação em duas etapas** na sua conta Google
2. **Gere uma senha de app**:
   - Vá para [Conta Google](https://myaccount.google.com/)
   - Segurança → Verificação em duas etapas → Senhas de app
   - Gere uma senha para "Email"
   - Use esta senha no campo `SMTP_PASS`

### 3. Outros Provedores de Email

#### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Servidor SMTP Corporativo
```bash
SMTP_HOST=mail.suaempresa.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Funcionalidades

### Alertas Automáticos

O sistema envia alertas automáticos nos seguintes casos:

1. **Falha de Job**: Quando qualquer job de notificação falha
2. **Falhas Consecutivas**: Quando um job falha 3 ou mais vezes consecutivas
3. **Problemas de Conectividade**: Quando há problemas de conexão com serviços críticos

### Destinatários

Os alertas são enviados para todos os usuários com role `admin` no sistema.

### Formato dos Emails

Os emails incluem:
- **Assunto**: Identifica claramente o tipo de alerta
- **Mensagem**: Descrição detalhada do problema
- **Detalhes Técnicos**: Informações como stack trace, duração, etc.
- **Recomendações**: Sugestões de ações a serem tomadas

## Testando a Configuração

### 1. Verificar Inicialização

Ao iniciar o servidor, você deve ver:
```
✅ Serviço de email inicializado com sucesso
```

Se não estiver configurado:
```
Configurações de email não encontradas. Alertas por email desabilitados.
```

### 2. Teste Manual

Você pode testar o envio de email usando o endpoint de jobs:

```bash
# Executar um job que pode falhar
curl -X POST http://localhost:3001/api/notifications/jobs/payment-check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Verificar Logs

Os logs mostrarão se os emails foram enviados:
```
Email de alerta enviado com sucesso para 1 administrador(es)
```

## Troubleshooting

### Problemas Comuns

1. **"Invalid login"**
   - Verifique se a senha de app está correta
   - Confirme se a verificação em duas etapas está ativa

2. **"Connection timeout"**
   - Verifique se o SMTP_HOST e SMTP_PORT estão corretos
   - Teste a conectividade: `telnet smtp.gmail.com 587`

3. **"Authentication failed"**
   - Use senha de app, não a senha normal da conta
   - Verifique se o email está correto

4. **"No administrators found"**
   - Certifique-se de que existem usuários com role `admin`
   - Verifique se os usuários admin têm email válido

### Logs de Debug

Para debug detalhado, adicione ao `.env`:
```bash
LOG_LEVEL=debug
```

## Segurança

### Boas Práticas

1. **Nunca commite credenciais** no repositório
2. **Use senhas de app** em vez de senhas normais
3. **Rotacione as credenciais** periodicamente
4. **Monitore os logs** de envio de email

### Configuração de Produção

Em produção, considere:
- Usar um serviço de email transacional (SendGrid, Mailgun, etc.)
- Configurar SPF, DKIM e DMARC
- Implementar rate limiting para envio de emails
- Monitorar métricas de entrega

## Monitoramento

### Métricas Importantes

- Taxa de entrega de emails
- Tempo de resposta do servidor SMTP
- Número de alertas enviados por dia
- Falhas no envio de alertas

### Alertas de Sistema

O próprio sistema de alertas pode falhar. Monitore:
- Logs de erro do serviço de email
- Falhas na inicialização do transporter
- Timeouts de conexão SMTP

## Exemplo de Email

```
Assunto: [ALERTA] Falha no Job: payment_check

🚨 Alerta do Sistema Financeiro

Falha no Job: payment_check

O job payment_check falhou durante sua execução.

Erro: Connection timeout

Esta falha pode impactar o funcionamento normal do sistema de notificações.
Recomenda-se verificar os logs e investigar a causa raiz do problema.

Detalhes Técnicos:
• Job: payment_check
• Status: Falha
• Data/Hora: 20/06/2025 15:30:45
• Duração: 5000ms
• Stack Trace: Error: Connection timeout...

Este é um alerta automático do Sistema Financeiro.
Data/Hora: 20/06/2025 15:30:45
```

## Suporte

Para problemas com o sistema de alertas:
1. Verifique os logs do servidor
2. Teste a conectividade SMTP
3. Confirme as configurações de email
4. Verifique se há usuários admin válidos 