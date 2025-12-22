// import express from 'express';
// import cors from 'cors';
// import 'dotenv/config';
// import shoppingRoutes from './routes/shoppingRoutes.js';
// import { pool } from './db/db.js'; 
// const app = express();
// app.use(cors());
// app.use(express.json());

// // בדיקת חיבור ל-DB
// app.get("/db-test", async (req, res) => {
//   console.log("Request received at /db-test");
//   try {
//     const result = await pool.query("SELECT NOW()");
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err); // הדפסת השגיאה המלאה לטרמינל (Console)
//     res.status(500).json({ error: "DB connection failed", details: err.message });
//   }
// });

// app.use('/api', shoppingRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import shoppingRoutes from './routes/shoppingRoutes.js';
import { pool } from './db/db.js'; 
export const app = express(); // ייצוא ה-app לטובת הבדיקות
app.use(cors());
app.use(express.json());

// בדיקת חיבור ל-DB
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM user_shopping_items where user_id=4");
    res.json(result.rows);
  } catch (err) {
    console.error("DB Connection Error:", err);
    res.status(500).json({ error: "DB connection failed", details: err.message });
  }
});

app.use('/api', shoppingRoutes);

const PORT = process.env.PORT || 5000;

// הפעלת השרת רק אם אנחנו לא במצב בדיקה
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}