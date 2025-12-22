import { getEmbedding } from './utils/geminiClient.js';
import { findClosestCategory, pool } from './models/dbService.js';

async function checkMapping() {
    console.log("--- בדיקת מיפוי מוצרים לקטגוריות (Semantic Search) ---");

    const testItems = [
        "חלב 3%",
        "לחם פרוס",
        "עגבניה",
        "שמפו לשיער",
        "אקונומיקה",
        "במבה אסם"
    ];

    for (const item of testItems) {
        try {
            console.log(`\n🔍 בודק מוצר: "${item}"...`);
            const vector = await getEmbedding(item);
            // הפונקציה findClosestCategory כבר מדפיסה ללוג את שם הקטגוריה שנמצאה והמרחק
            await findClosestCategory(vector);
        } catch (error) {
            console.error(`❌ שגיאה בבדיקת ${item}:`, error.message);
        }
    }

    console.log("\n--- סיום בדיקה ---");
    pool.end(); // סגירת החיבור ל-DB בסיום
}

checkMapping();