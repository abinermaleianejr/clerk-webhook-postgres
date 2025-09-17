const { Pool } = require('pg');
const { databaseUrl } = require('./config');

// Configuração do pool de conexões
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createUser(userData) {
  const client = await pool.connect();
  console.log("conected", client);
  try {
    await client.query('BEGIN');
    
    // Inserir na tabela user
    const userRes = await client.query(
      `INSERT INTO "users" 
       (first_name, last_name, username, password, email, "user_status", id)
       VALUES ($1, $2, $3, $4, $5, $6,$7 )
       RETURNING id`,
      [
        userData.firstName,
        userData.lastName,
        userData.username || userData.email.split('@')[0],
        'clerk_placeholder',
        userData.email,
        1, // userStatus ativo
        userData.userId
      ]
    );


    
    

    // Inserir na userdetails se existirem dados
    if (userData.address || userData.phone) {
      await client.query(
        `INSERT INTO user_details
         (address, "date_of_birth", country, "postal_code", phone, "alternative_email", "document_id", "user_id")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userData.address || '',
          userData.dateOfBirth || null,
          userData.country || 'MZ',
          userData.postalCode || null,
          userData.phone || '',
          userData.alternativeEmail || null,
          userData.documentId || '',
           userData.userId
        ]
      );
    }

    await client.query('COMMIT');
    return userData.userId;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database Error:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createUser };
