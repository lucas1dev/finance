# Configuração de Produção - Finance Server

## 🚀 Configurações Implementadas

### 1. Segurança
- **Helmet.js**: Configuração avançada de segurança com CSP, HSTS
- **Rate Limiting**: Limite de 100 requisições por 15 minutos (configurável)
- **CORS**: Configuração restritiva para origens permitidas
- **JWT**: Chave secreta forte e expiração de 8 horas
- **Compressão**: Gzip para melhor performance

### 2. Performance
- **Compression**: Gzip para reduzir tamanho das respostas
- **Timeout**: Configurações otimizadas para produção
- **Memory Management**: Limite de memória configurado
- **Keep-Alive**: Configurações otimizadas

### 3. Logging
- **Winston**: Sistema de logging estruturado
- **Rotação de Logs**: Arquivos de 5MB com rotação automática
- **Logs Separados**: Error, HTTP, Combined, Exceptions, Rejections
- **Formato JSON**: Para fácil parsing e análise

### 4. Monitoramento
- **Health Check**: Endpoint `/health` para monitoramento
- **Graceful Shutdown**: Tratamento adequado de SIGTERM/SIGINT
- **Error Handling**: Tratamento de erros não capturados
- **Performance Logging**: Logs de duração de operações

## 📋 Arquivos de Configuração

### Variáveis de Ambiente
- `.env`: Configuração de desenvolvimento
- `env.production`: Configuração de produção (template)

### PM2
- `ecosystem.config.js`: Configuração para PM2 com cluster mode

### Logs
- `logs/`: Diretório para arquivos de log
  - `error.log`: Apenas erros
  - `combined.log`: Todos os logs
  - `http.log`: Requisições HTTP
  - `exceptions.log`: Exceções não tratadas
  - `rejections.log`: Promises rejeitadas

## 🔧 Comandos de Produção

### Iniciar Servidor
```bash
# Modo produção simples
npm run prod

# Com PM2 (recomendado)
npm run prod:pm2

# Direto com Node
NODE_ENV=production node server.js
```

### Gerenciar com PM2
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Monitorar
pm2 monit

# Ver logs
pm2 logs finance-server

# Reiniciar
pm2 restart finance-server

# Parar
pm2 stop finance-server

# Deletar
pm2 delete finance-server
```

### Verificar Status
```bash
# Health check
curl http://localhost:3002/health

# Verificar logs
tail -f logs/combined.log

# Verificar processos
pm2 status
```

## 🔒 Configurações de Segurança

### Variáveis de Ambiente Obrigatórias
```bash
NODE_ENV=production
JWT_SECRET=chave_super_secreta_producao_2024_finance_system_secure_key_123456789
DB_PASS=sua_senha_segura_do_banco
CLIENT_URL=https://seu-dominio.com
```

### Configurações Recomendadas
- Use HTTPS em produção
- Configure firewall adequadamente
- Use variáveis de ambiente seguras
- Monitore logs regularmente
- Configure backup do banco de dados

## 📊 Monitoramento

### Health Check Response
```json
{
  "status": "OK",
  "timestamp": "2024-06-19T02:40:10.941Z",
  "uptime": 123.456,
  "environment": "production",
  "version": "1.0.0"
}
```

### Logs de Performance
- Requisições HTTP com duração
- Operações de banco de dados
- Eventos de segurança
- Erros detalhados

## 🚨 Troubleshooting

### Porta em Uso
```bash
# Verificar processo
lsof -ti:3002

# Matar processo
lsof -ti:3002 | xargs kill -9
```

### Logs de Erro
```bash
# Ver erros recentes
tail -f logs/error.log

# Ver todas as requisições
tail -f logs/http.log
```

### Reiniciar Servidor
```bash
# Com PM2
pm2 restart finance-server

# Manual
pkill -f "node.*server"
NODE_ENV=production node server.js
```

## 📈 Otimizações Implementadas

1. **Compressão Gzip**: Reduz tamanho das respostas
2. **Rate Limiting**: Protege contra ataques DDoS
3. **CORS Restritivo**: Apenas origens permitidas
4. **Logging Estruturado**: JSON para análise
5. **Graceful Shutdown**: Fecha conexões adequadamente
6. **Error Handling**: Tratamento robusto de erros
7. **Performance Monitoring**: Logs de duração
8. **Security Headers**: Helmet.js configurado

## 🔄 Deploy

### Com PM2 (Recomendado)
```bash
# 1. Configurar variáveis de ambiente
cp env.production .env
# Editar .env com valores reais

# 2. Instalar dependências
npm install --production

# 3. Executar migrations
npm run migrate

# 4. Iniciar com PM2
pm2 start ecosystem.config.js --env production

# 5. Salvar configuração PM2
pm2 save
pm2 startup
```

### Com Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["npm", "run", "prod"]
```

## 📞 Suporte

Para problemas em produção:
1. Verifique logs em `logs/`
2. Teste endpoint `/health`
3. Verifique variáveis de ambiente
4. Monitore uso de recursos
5. Configure alertas de monitoramento 