const { Pool } = require('pg');
const { databaseUrl } = require('./config');

// Configuração do pool de conexões
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.APP_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createUser(userData) {
  const client = await pool.connect();
  console.log("conected", client);
  try {
    await client.query('BEGIN');
    
    // Inserir na tabela user
    const userRes = await client.query(
      `INSERT INTO "users" 
       (firstname, lastname, username, password, email, "userStatus")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        userData.firstName,
        userData.lastName,
        userData.username || userData.email.split('@')[0],
        'clerk_placeholder',
        userData.email,
        1 // userStatus ativo
      ]
    );

    const userId = userRes.rows[0].id;

    // Inserir na userdetails se existirem dados
    if (userData.address || userData.phone) {
      await client.query(
        `INSERT INTO user_details
         (address, "dateOfBirth", country, "postalCode", phone, "alternativeEmail", "documentId", "userId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userData.address || '',
          userData.dateOfBirth || null,
          userData.country || 'MZ',
          userData.postalCode || null,
          userData.phone || '',
          userData.alternativeEmail || null,
          userData.documentId || '',
          userId
        ]
      );
    }

    await client.query('COMMIT');
    return userId;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database Error:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createUser };
