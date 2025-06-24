const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testReceivablesAPI() {
  try {
    // Criar token para usuário ID 3 (que tem recebíveis)
    const token = jwt.sign({ userId: 3 }, 'your-secret-key');
    
    console.log('🔑 Token criado:', token.substring(0, 20) + '...');
    
    // Testar API de recebíveis
    const response = await axios.get('http://localhost:3000/api/receivables', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ API funcionando!');
    console.log('📊 Recebíveis encontrados:', response.data.length);
    
    if (response.data.length > 0) {
      console.log('📄 Primeiro recebível:', JSON.stringify(response.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.response?.data || error.message);
  }
}

testReceivablesAPI(); 