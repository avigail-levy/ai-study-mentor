// import { pool } from '../db/db.js';
// import { getEmbedding } from './utils/GeminiClient.js';
// async function updateCategoryEmbeddings() {
//     console.log("--- מתחיל עדכון וקטורי קטגוריות ---");
    
//     // 1. שלוף את כל הקטגוריות החסרות וקטורים
//     const selectQuery = `
//         SELECT id, name
//         FROM categories
//         WHERE gemini_embedding IS NULL
//         ORDER BY id;
//     `;
    
//     try {
//         const categoriesResult = await pool.query(selectQuery);
//         const categories = categoriesResult.rows;

//         if (categories.length === 0) {
//             console.log("כל הקטגוריות כבר מכילות וקטורים. אין צורך בעדכון.");
//             return;
//         }

//         console.log(`נמצאו ${categories.length} קטגוריות לעדכון...`);

//         // 2. עבור על כל קטגוריה, חשב וקטור ועדכן את ה-DB
//         for (const category of categories) {
//             try {
//                 // חישוב ה-Embedding באמצעות Gemini
//                 const embeddingVector = await getEmbedding(category.name);
                
//                 // ודא שהוקטור בגודל תקין
//                 if (!embeddingVector || embeddingVector.length !== 768) {
//                     throw new Error(`וקטור לא תקין עבור קטגוריה ID ${category.id}`);
//                 }
                
//                 // הפיכת מערך המספרים למחרוזת וקטור (כנדרש ל-pgvector)
//                 const embeddingString = `[${embeddingVector.join(',')}]`;

//                 // עדכון ה-DB
//                 const updateQuery = `
//                     UPDATE categories
//                     SET gemini_embedding = $1
//                     WHERE id = $2;
//                 `;
//                 await pool.query(updateQuery, [embeddingString, category.id]);
//                 console.log(`✅ עודכן בהצלחה: ID ${category.id} - ${category.name}`);

//             } catch (embedError) {
//                 console.error(`❌ שגיאה בעדכון קטגוריה ID ${category.id}: ${embedError.message}`);
//             }
//         }
        
//         console.log("--- סיום עדכון וקטורי קטגוריות ---");

//     } catch (dbError) {
//         console.error("שגיאה כללית בגישה למסד הנתונים:", dbError.message);
//     }
// }

// updateCategoryEmbeddings();
import { pool } from '../../db/db.js';
import { getEmbedding } from './geminiClient.js'; // נניח שזו הפונקציה שצירפת
// ... וכל הייבוא שנדרש ...

/**
 * פונקציית עזר לנורמליזציה (L2) של וקטור
 * הופכת את אורך הוקטור ל-1, ומונעת הטיה בחישוב מרחק אוקלידי (L2).
 */
function normalizeVector(vector) {
    if (!vector || vector.length === 0) return [];
    
    // חישוב הנורמה (אורך) של הוקטור
    const magnitude = Math.sqrt(
        vector.reduce((sum, val) => sum + val * val, 0)
    );
    
    // אם הנורמה גדולה מאפס (וזה המצב בדרך כלל), נרמל.
    if (magnitude > 1e-6) {
        return vector.map(val => val / magnitude);
    }
    return vector; 
}


async function updateCategoryEmbeddings() {
    console.log("--- מתחיל עדכון וקטורי קטגוריות ---");
    
    // 1. שלוף את כל הקטגוריות החסרות וקטורים (כעת כולם NULL)
    const selectQuery = `
        SELECT id, name
        FROM categories
        WHERE gemini_embedding IS NULL
        ORDER BY id;
    `;
    
    try {
        const categoriesResult = await pool.query(selectQuery);
        const categories = categoriesResult.rows;

        if (categories.length === 0) {
            console.log("כל הקטגוריות כבר מכילות וקטורים מנורמלים. אין צורך בעדכון.");
            return;
        }

        console.log(`נמצאו ${categories.length} קטגוריות לעדכון...`);

        // 2. עבור על כל קטגוריה, חשב וקטור, נרמל ועדכן את ה-DB
        for (const category of categories) {
            try {
                // א. חישוב ה-Embedding
                const rawVector = await getEmbedding(category.name);
                
                // ב. 🚨 שלב קריטי: נורמליזציה
                const embeddingVector = normalizeVector(rawVector); 

                // ג. בדיקות תקינות
                if (!embeddingVector || embeddingVector.length !== 768) {
                    throw new Error(`וקטור לא תקין עבור קטגוריה ID ${category.id}`);
                }
                
                // ד. הפיכת מערך המספרים למחרוזת וקטור (נדרש ל-pgvector)
                const embeddingString = `[${embeddingVector.join(',')}]`;

                // ה. עדכון ה-DB
                const updateQuery = `
                    UPDATE categories
                    SET gemini_embedding = $1::vector(768)
                    WHERE id = $2;
                `;
                await pool.query(updateQuery, [embeddingString, category.id]);
                console.log(`✅ עודכן בהצלחה: ID ${category.id} - ${category.name}`);

            } catch (embedError) {
                console.error(`❌ שגיאה בעדכון קטגוריה ID ${category.id}: ${embedError.message}`);
            }
        }
        
        console.log("--- סיום עדכון וקטורי קטגוריות. החיפוש כעת סמנטי ---");

    } catch (dbError) {
        console.error("שגיאה כללית בגישה למסד הנתונים:", dbError.message);
    }
}

updateCategoryEmbeddings();