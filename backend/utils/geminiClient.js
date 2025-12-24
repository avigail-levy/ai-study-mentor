// if (!process.env.GEMINI_API_KEY) {
//     console.error("שגיאה: משתנה הסביבה GEMINI_API_KEY לא הוגדר.");
// }

// const API_KEY = process.env.GEMINI_API_KEY;
// const EMBEDDING_MODEL = 'text-embedding-004'; 

// /*
//  מקבלת מחרוזת טקסט ומחזירה את הקידוד הווקטורי שלה (Embedding).
//   שימוש ב-SDK הרשמי לטיפול נכון בפורמט הבקשה.
//  */
// export async function getEmbedding(text) {
//     console.log(`embdding-------------- Input: "${text}"`);
//     if (!text || text.trim() === '') {
//         throw new Error("Text cannot be empty for embedding.");
//     }
    
//     try {
//         const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${API_KEY}`;
        
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json; charset=utf-8',
//             },
//             body: JSON.stringify({
//                 content: {
//                     parts: [{ text: String(text) }]
//                 }
//             })
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
//         }

//         const data = await response.json();

//         if (data && data.embedding && data.embedding.values) {
//              const vec = data.embedding.values;
//              console.log(`Vector generated. Length: ${vec.length}, First 5 values: [${vec.slice(0, 5).join(', ')}]`);
//              return vec;
//         }

//         throw new Error("מבנה תגובה לא צפוי מה-API.");

//     } catch (error) {
//         console.error("שגיאה ביצירת וקטור:", error);
//         throw new Error("נכשל ביצירת וקטור ייצוגי");
//     }
// }

// /*
//   משווה בין שני וקטורים ומחזיר את מידת הדמיון ביניהם
//  */
// export function compareVectors(vec1, vec2) {
//     // אימות קלט
//     if (vec1.length !== vec2.length) {
//         throw new Error("לא ניתן להשוות וקטורים באורך שונה");
//     }
    
//     // חישוב מכפלה סקלרית
//     let dotProduct = 0;
//     let norm1 = 0;
//     let norm2 = 0;
    
//     for (let i = 0; i < vec1.length; i++) {
//         dotProduct += vec1[i] * vec2[i];
//         norm1 += vec1[i] * vec1[i];
//         norm2 += vec2[i] * vec2[i];
//     }
    
//     // חישוב קוסינוס הדמיון (cosine similarity)
//     return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
// }

// /*
//   מחפשת את הקטגוריה הכי דומה לטקסט נתון
//  */
// export async function findClosestCategory(text) {
//     //  תיקון: קוראים רק פעם אחת, משתמשים ב-await, ושומרים את התוצאה
//     const categories = await getCategories(); 
    
//     // אימות קלט (הקטגוריות צריכות להיות מערך)
//     if (!Array.isArray(categories) || categories.length === 0) {
//         throw new Error("לא נמצאו קטגוריות להשוואה");
//     }

//     try {
//         // ... יצירת וקטור לטקסט החדש ...
//         const textVector = await getEmbedding(text);
//         let bestMatch = { category: null, score: -1, distance: -1 };
        
//         // חיפוש הקטגוריה הכי דומה
//         for (const category of categories) { 
//             const categoryVector = category.gemini_embedding; 
//             const similarity = compareVectors(textVector, categoryVector);
            
//             if (similarity > bestMatch.score) {
//                 bestMatch = { category, score: similarity, distance: 1 - similarity }; // 1-similarity הוא המרחק
//             }
//         }
        
//         // נחזיר ID ומרחק, כפי שהיה ב-DB Service (זהות פונקציונלית)
//         return {
//             categoryId: bestMatch.category ? bestMatch.category.id : null,
//             distance: bestMatch.distance,
//             score: bestMatch.score
//         };
        
//     } catch (error) {
//         console.error("שגיאה בחיפוש קטגוריה קרובה:", error);
//         throw new Error("נכשל במציאת קטגוריה מתאימה");
//     }
// }
// /*
//  יוצרת תגובה טקסטואלית כללית באמצעות Gemini.
//  */
// export async function generateAIResponse(prompt) {
//     // נשתמש ב-fetch API ישירות מכיוון שזה מה שמומש לך
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

//     const payload = {
//         contents: [
//             { role: "user", parts: [{ text: prompt }] }
//         ]
//     };

//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });

//         const data = await response.json();
        
//         if (!response.ok) {
//             throw new Error(`שגיאת HTTP: ${response.status}. פרטים: ${data.error ? data.error.message : JSON.stringify(data)}`);
//         }

//         // חילוץ התשובה הטקסטואלית
//         const text = data.candidates[0].content.parts[0].text;
//         return text;

//     } catch (error) {
//         console.error("שגיאה ביצירת תשובה מה-AI:", error.message);
//         // במקרה של כשל, נחזיר הודעה חלופית
//         return "נכשל ליצור סיכום AI, אך המסלול חושב בהצלחה.";
//     }
// }
import { pool } from '../db/db.js'; // נדרש עבור getCategories אם היא באותו קובץ

// פונקציית עזר להשהיה (מונעת חסימת קצב בקשות)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

if (!process.env.GEMINI_API_KEY) {
    console.error("שגיאה: משתנה הסביבה GEMINI_API_KEY לא הוגדר.");
}

const API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-004'; 

/**
 * מקבלת מחרוזת טקסט ומחזירה את הקידוד הווקטורי שלה.
 * כוללת מנגנון Retry לטיפול בשגיאות 500 זמניות.
 */
export async function getEmbedding(text, retries = 3) {
    if (!text || text.trim() === '') {
        throw new Error("Text cannot be empty for embedding.");
    }

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`embdding-------------- Input: "${text}" (Attempt ${i + 1})`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${API_KEY}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({
                    content: { parts: [{ text: String(text) }] }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                // אם זו שגיאת שרת (500) או עומס (429), ננסה שוב
                if (response.status === 500 || response.status === 429) {
                    console.warn(`Gemini API busy/error (${response.status}). Retrying in 1s...`);
                    await delay(1000);
                    continue; 
                }
                throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            if (data?.embedding?.values) {
                const vec = data.embedding.values;
                console.log(`✅ Vector generated. Length: ${vec.length}`);
                return vec;
            }
            throw new Error("מבנה תגובה לא צפוי מה-API.");

        } catch (error) {
            if (i === retries - 1) {
                console.error("❌ כל הניסיונות ליצירת וקטור נכשלו:", error.message);
                throw new Error("נכשל ביצירת וקטור ייצוגי לאחר מספר ניסיונות");
            }
            await delay(1000);
        }
    }
}

/**
 * משווה בין שני וקטורים (Cosine Similarity)
 */
export function compareVectors(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
        return 0; // מניעת קריסה במקרה של וקטור חסר
    }
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * פונקציית עזר לשליפת קטגוריות מה-DB (אם לא קיימת אצלך)
 */
async function getCategories() {
    const res = await pool.query("SELECT id, name, gemini_embedding FROM categories WHERE gemini_embedding IS NOT NULL");
    return res.rows;
}

/**
 * מחפשת את הקטגוריה הכי דומה לטקסט נתון
 */
export async function findClosestCategory(text) {
    try {
        const categories = await getCategories(); 
        if (!categories || categories.length === 0) {
            throw new Error("לא נמצאו קטגוריות עם וקטורים בבסיס הנתונים");
        }

        const textVector = await getEmbedding(text);
        let bestMatch = { category: null, score: -1 };
        
        for (const category of categories) { 
            // המרה ממחרוזת למערך אם ה-DB מחזיר מחרוזת וקטור
            const catVec = typeof category.gemini_embedding === 'string' 
                ? JSON.parse(category.gemini_embedding.replace('{', '[').replace('}', ']'))
                : category.gemini_embedding;

            const similarity = compareVectors(textVector, catVec);
            
            if (similarity > bestMatch.score) {
                bestMatch = { category, score: similarity };
            }
        }
        
        console.log(`🎯 Mapped "${text}" to category: ${bestMatch.category?.name} (Score: ${bestMatch.score.toFixed(3)})`);

        return {
            categoryId: bestMatch.category ? bestMatch.category.id : null,
            score: bestMatch.score,
            distance: 1 - bestMatch.score
        };
        
    } catch (error) {
        console.error("שגיאה בחיפוש קטגוריה:", error.message);
        return { categoryId: null, score: 0, distance: 1 };
    }
}

/**
 * יוצרת תגובה טקסטואלית (סיכום) באמצעות Gemini
 */
export async function generateAIResponse(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "AI Error");

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AI Response Error:", error.message);
        return "נכשל ליצור סיכום AI, אך המסלול חושב בהצלחה.";
    }
}