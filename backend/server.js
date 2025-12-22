import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import shoppingRoutes from './routes/shoppingRoutes.js';
import { pool } from './db/db.js'; 
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', shoppingRoutes);

// בדיקת חיבור ל-DB
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "DB connection failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});