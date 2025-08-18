const express = require('express');
const { Webhook } = require('svix');
const { clerkWebhookSecret } = require('./config');
const { createUser } = require('./db');

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  const headers = req.headers;
  const payload = req.body;
  
  try {
    // Verificar assinatura do webhook
    const wh = new Webhook(clerkWebhookSecret);
    const evt = wh.verify(JSON.stringify(payload), {
      'svix-id': headers['svix-id'],    
      'svix-timestamp': headers['svix-timestamp'],
      'svix-signature': headers['svix-signature'],
    });
    
    // Processar evento de criação de usuário
    if (evt.type === 'user.created') {
      const userData = {
        firstName: evt.data.first_name,
        lastName: evt.data.last_name,
        email: evt.data.email_addresses[0].email_address,
        phone: evt.data.phone_numbers[0]?.phone_number || '',
        // Mapear outros campos do Clerk para suas tabelas
        address: evt.data.unsafe_metadata?.address || '',
        dateOfBirth: evt.data.unsafe_metadata?.dateOfBirth || null,
        country: evt.data.unsafe_metadata?.country || 'MZ',
        documentId: evt.data.unsafe_metadata?.documentId || ''
      };
      
      const userId = await createUser(userData);
      console.log(`Usuário criado com ID: ${userId}`);
    }
    
    res.status(200).end();
  } catch (err) {
    console.error('Erro no webhook:', err);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});