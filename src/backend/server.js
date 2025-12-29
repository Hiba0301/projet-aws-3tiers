require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

let pool;

async function initDb() {
  pool = await mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

initDb().catch((err) => {
  console.error('Erreur init pool MySQL:', err);
  process.exit(1);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Créer un utilisateur
app.post('/api/users', async (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'username et email requis' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      [username, email]
    );
    const insertedId = result.insertId;
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [insertedId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur création utilisateur' });
  }
});

// Lister tous les utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération users' });
  }
});

// Récupérer les tâches d'un user
app.get('/api/users/:id/tasks', async (req, res) => {
  const userId = req.params.id;
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY id',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération tâches' });
  }
});

// Créer une tâche pour un user
app.post('/api/users/:id/tasks', async (req, res) => {
  const userId = req.params.id;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title requis' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO tasks (user_id, title, is_done) VALUES (?, ?, false)',
      [userId, title]
    );
    const insertedId = result.insertId;
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [insertedId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur création tâche' });
  }
});

// Mettre à jour l'état d'une tâche
app.put('/api/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  const { is_done } = req.body;

  if (typeof is_done !== 'boolean') {
    return res.status(400).json({ error: 'is_done doit être boolean' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE tasks SET is_done = ? WHERE id = ?',
      [is_done, taskId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur mise à jour tâche' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend démarré sur le port ${port}`);
});
