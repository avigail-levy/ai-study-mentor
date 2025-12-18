// // backend/server.js - קוד מעודכן

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import 'dotenv/config'; 
import { fileURLToPath } from 'url';
// import fs from 'fs/promises'; // שימוש ב-fs/promises כדי למחוק קבצים
import { pool } from '../db/db.js'; 

import { 
    findClosestCategory,
    getMappedItemsForPathfinding,
    updateItemOrder,
    getSortedShoppingList,
    addItemToRawList, 
    updateItemMapping, 
    getUnmappedItems, 
    findOrCreateUser 
} from '../db/dbService.js';
// import {findClosestCategory} from './utils/geminiClient.js'

// // יבוא מודולים
import { getEmbedding , generateAIResponse} from './utils/geminiClient.js';
// import { analyzeImage, analyzeAudio, analyzeTextFromFiles } from './utils/assistant.js'; // הוסף את analyzeTextFromFiles (ראי סעיף 5)
import { calculateShortestPath } from './pathfinding.js'; // ייבוא האלגוריתם החדש
// import {  // ייבוא ה-Pool של ה-DB
//     findClosestCategory,
//     getMappedItemsForPathfinding,
//     updateItemOrder,
//     getSortedShoppingList,
//     addItemToRawList, // צריך לממש ב-dbService.js
//     updateItemMapping, // צריך לממש ב-dbService.js
//     getUnmappedItems, // צריך לממש ב-dbService.js
//     findOrCreateUser 
// } from './dbService.js';


// // [חלקים בסיסיים של השרת - נשארים זהים]
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB connection failed" });
  }
});

// // [סוף חלקים בסיסיים]


// // **********************************
// // *** 1. Routes ניהול משתמשים ורשימה ***
// // **********************************

// // הוספת פריט גולמי לרשימה (טקסטואלי)
app.post('/api/list/add-item', async (req, res) => {
    try {
        const { userId, item_name } = req.body;
        if (!userId || !item_name) {
            return res.status(400).json({ error: 'UserID and item name required' });
        }
        console.log("app.post(/api/list/add-item",userId, item_name)
        const itemId = await addItemToRawList(userId, item_name); 
        res.json({ success: true, itemId });
    } catch (error) {
        console.error('Add Item Error:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});


// **********************************
// *** 2. Routes מסלול חכם (הפונקציה המרכזית) ***
// **********************************

// Route המרכזי: מיפוי וחישוב מסלול
app.post('/api/calculate-path', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'UserID required' });
        }

        // 1. מיפוי (AI Mapping): טפל בפריטים לא ממופים
        const unmappedItems = await getUnmappedItems(userId); // פונקציה לממש ב-dbService

        for (const item of unmappedItems) {
            try {
                console.log(`Attempting to map item: ${item.item_name} (ID: ${item.id})`);
                
                // שלב 1: קבלת ה-Embedding מה-AI
                const itemEmbedding = await getEmbedding(item.item_name);

                if (!itemEmbedding) {
                    console.error(`Failed to get embedding for: ${item.item_name}. Skipping.`);
                    continue;
                }
                // שלב 2: מציאת הקטגוריה הקרובה ביותר (ב-DB)
                const categoryId = await findClosestCategory(itemEmbedding);
                // const categoryId = await findClosestCategory(item.item_name).categoryId;

                if (categoryId) {
                    // עדכון ה-DB עם ה-mapped_category_id
                    await updateItemMapping(categoryId,item.id); 
                    console.log(`Successfully mapped ${item.item_name} to Category ID: ${categoryId}`);
                } else {
                    console.log(`No closest category found for: ${item.item_name}. Skipping.`);
                }
            } catch (e) {
                // קריטי: אם יש שגיאה ב-API של Gemini או בחיבור ל-DB.
                console.error(`Critical error during mapping of ${item.item_name}:`, e.message);
                // ממשיכים לפריט הבא, כדי לא להפיל את כל התהליך.
            }
        }

        // 2. הכנת קואורדינטות: שלוף את כל הפריטים הממופים והקואורדינטות שלהם (R, C)
        const mappedItems = await getMappedItemsForPathfinding(userId);

        // *** לוודא שמופעל מיפוי לאחר הלולאה, למקרה שהצליחו מיפויים בסיבוב הזה ***
        // שלוף שוב, רק כדי לוודא ש-mappedItems מכיל את כל הפריטים שמופו כרגע
        // (אם הלוגיקה של getUnmappedItems לא משתנה בין קריאות)

        if (mappedItems.length === 0) {
            return res.json({ success: true, list: [], answer: 'הרשימה ריקה או שעדיין לא מופתה בהצלחה.' });
        }

        // 3. חישוב מסלול (Pathfinding)
        const calculatedOrderMap = calculateShortestPath(mappedItems);

        // 4. עדכון הסדר המחושב ב-DB
        for (const itemId in calculatedOrderMap) {
            await updateItemOrder(parseInt(itemId), calculatedOrderMap[itemId]);
        }

        // 5. שליפת הרשימה המסודרת והחזרה למשתמש
        const finalSortedList = await getSortedShoppingList(userId); 

        // סינתזת תשובה סופית
        const pathSummary = finalSortedList.map(item => item.item_name).join(' -> ');
        const prompt = `המסלול הקצר ביותר לרשימת הקניות שלך הוא: ${pathSummary}.`;
        
        let aiSummary;
        try {
            aiSummary = await generateAIResponse(prompt);
        } catch (e) {
            console.error("Failed to generate AI summary:", e.message);
            aiSummary = `נכשל ליצור סיכום AI, אך המסלול חושב בהצלחה: ${pathSummary}.`;
        }

        res.json({
            success: true,
            answer: aiSummary,
            list: finalSortedList,
        });
    } catch (error) {
        console.error('Error in calculate-path route:', error);
        res.status(500).json({ error: 'Search and Pathfinding error' });
    }
});
// // **********************************
// // *** 3. Routes מולטימדיה (העלאה וניתוח) ***
// // **********************************

// // פונקציה כללית לטיפול בקבצים
// async function handleFileUpload(req, res, analyzerFn) {
//     if (!req.file) {
//         return res.status(400).json({ error: 'File required' });
//     }
//     const { userId } = req.body;
//     let filePath = req.file.path;

//     try {
//         // 1. ניתוח הקובץ (תמונה/אודיו) באמצעות Gemini
//         const extractedText = await analyzerFn(filePath); 

//         // 2. הפיכת הטקסט הגולמי לפריטים בודדים (נניח מופרדים בפסיקים או שורות חדשות)
//         const items = extractedText.split(/[\n,;]/).map(item => item.trim()).filter(item => item.length > 0);
        
//         // 3. הוספת הפריטים הגולמיים לרשימה ב-DB
//         for (const item of items) {
//              // פונקציה לממש ב-dbService
//             await addItemToRawList(userId, item); 
//         }

//         // 4. הפעלת אלגוריתם המסלול לעיבוד הנתונים החדשים
//         // (הקריאה לפונקציה calculate-path)

//         res.json({ 
//             success: true, 
//             message: 'File analyzed and items added to list.',
//             extractedText: extractedText
//         });
//     } catch (error) {
//         console.error('File Upload Error:', error);
//         res.status(500).json({ error: 'Error processing file' });
//     } finally {
//         // מחיקת הקובץ הזמני
//         await fs.unlink(filePath).catch(err => console.error("Failed to delete file:", err));
//     }
// }


// // Routes העלאת קבצים
// app.post('/upload-image', upload.single('image'), (req, res) => {
//     handleFileUpload(req, res, analyzeImage);
// });

// app.post('/upload-audio', upload.single('audio'), (req, res) => {
//     handleFileUpload(req, res, analyzeAudio);
// });

// // [הוסף Routes ל-DB Init/Status, Login, וכו', כפי שהיו בקובץ שלך]
// app.get("/health", (req, res) => {
//   res.json({ status: "ok" });
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
