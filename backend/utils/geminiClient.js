// backend/utils/geminiClient.js - שימוש ב-Fetch API ישיר
import  { getCategories }  from '../../db/dbService.js'
// ודא ש-API Key נמצא!
if (!process.env.GEMINI_API_KEY) {
    console.error("שגיאה: משתנה הסביבה GEMINI_API_KEY לא הוגדר.");
}

const API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-004'; 

/**
 * מקבלת מחרוזת טקסט ומחזירה את הקידוד הווקטורי שלה (Embedding).
 * *** עוקפת את ה-SDK באמצעות fetch API עקב שגיאת requests[] חוזרת. ***
 */
export async function getEmbedding(text) {
    console.log("embdding--------------")
    if (!text || text.trim() === '') {
        throw new Error("Text cannot be empty for embedding.");
    }
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${API_KEY}`;
        
        const payload = {
            // שולח את ה-content במבנה המדויק שה-API מצפה לו (ללא עטיפת requests)
            content: { 
                parts: [{ text: text }] 
            },
            taskType: 'RETRIEVAL_DOCUMENT'
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            // אם יש שגיאה ב-API Key או במודל
            throw new Error(`שגיאת HTTP: ${response.status}. פרטים: ${data.error ? data.error.message : JSON.stringify(data)}`);
        }
        
        // בודק את מבנה התגובה של ה-API
        if (data && data.embedding && data.embedding.values) {
             return data.embedding.values;
        }

        throw new Error("מבנה תגובה לא צפוי או וקטור ריק מה-API.");

    } catch (error) {
        console.error("שגיאה ביצירת וקטור:", error.message);
        throw new Error("נכשל ביצירת וקטור ייצוגי");
    }
}

// ... שאר הפונקציות (compareVectors, findClosestCategory) נשארות כפי שהיו.
/**
 * משווה בין שני וקטורים ומחזיר את מידת הדמיון ביניהם
 * @param {number[]} vec1 - וקטור ראשון להשוואה
 * @param {number[]} vec2 - וקטור שני להשוואה
 * @returns {number} ציון דמיון בין 0 ל-1 (1 = זהים לחלוטין)
 * @throws {Error} אם הוקטורים באורך שונה
 */
export function compareVectors(vec1, vec2) {
    // אימות קלט
    if (vec1.length !== vec2.length) {
        throw new Error("לא ניתן להשוות וקטורים באורך שונה");
    }
    
    // חישוב מכפלה סקלרית
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }
    
    // חישוב קוסינוס הדמיון (cosine similarity)
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * מחפשת את הקטגוריה הכי דומה לטקסט נתון
 * @param {string} text - הטקסט לחיפוש
 * @param {Array} categories - מערך קטגוריות קיימות
 * @returns {Object} אובייקט המכיל את הקטגוריה הכי דומה וציון הדמיון
 * @throws {Error} אם אין קטגוריות או שיש שגיאה בחיפוש
 */
// backend/utils/geminiClient.js (הפונקציה המתוקנת)

export async function findClosestCategory(text) {
    // 🚨 תיקון: קוראים רק פעם אחת, משתמשים ב-await, ושומרים את התוצאה
    const categories = await getCategories(); 
    
    // אימות קלט (הקטגוריות צריכות להיות מערך)
    if (!Array.isArray(categories) || categories.length === 0) {
        throw new Error("לא נמצאו קטגוריות להשוואה");
    }

    try {
        // ... יצירת וקטור לטקסט החדש ...
        const textVector = await getEmbedding(text);
        let bestMatch = { category: null, score: -1, distance: -1 };
        
        // חיפוש הקטגוריה הכי דומה
        for (const category of categories) { // 🚨 תיקון: עוברים בלולאה על המערך categories
            const categoryVector = category.gemini_embedding; // 🚨 ודא שאתה משתמש בשם העמודה הנכון (gemini_embedding)!
            const similarity = compareVectors(textVector, categoryVector);
            
            if (similarity > bestMatch.score) {
                bestMatch = { category, score: similarity, distance: 1 - similarity }; // 1-similarity הוא המרחק
            }
        }
        
        // נחזיר ID ומרחק, כפי שהיה ב-DB Service (זהות פונקציונלית)
        return {
            categoryId: bestMatch.category ? bestMatch.category.id : null,
            distance: bestMatch.distance,
            score: bestMatch.score
        };
        
    } catch (error) {
        console.error("שגיאה בחיפוש קטגוריה קרובה:", error);
        throw new Error("נכשל במציאת קטגוריה מתאימה");
    }
}
/**
 * יוצרת תגובה טקסטואלית כללית באמצעות Gemini.
 * @param {string} prompt - הפרומפט שיש לשלוח למודל.
 * @returns {Promise<string>} - התשובה הטקסטואלית של ה-AI.
 */
export async function generateAIResponse(prompt) {
    // נשתמש ב-fetch API ישירות מכיוון שזה מה שמומש לך
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [
            { role: "user", parts: [{ text: prompt }] }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`שגיאת HTTP: ${response.status}. פרטים: ${data.error ? data.error.message : JSON.stringify(data)}`);
        }

        // חילוץ התשובה הטקסטואלית
        const text = data.candidates[0].content.parts[0].text;
        return text;

    } catch (error) {
        console.error("שגיאה ביצירת תשובה מה-AI:", error.message);
        // במקרה של כשל, נחזיר הודעה חלופית
        return "נכשל ליצור סיכום AI, אך המסלול חושב בהצלחה.";
    }
}