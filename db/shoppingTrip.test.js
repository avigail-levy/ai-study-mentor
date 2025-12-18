// backend/tests/shoppingTrip.test.js

import { findClosestCategory } from '../utils/geminiClient.js';
import * as dbService from '../../db/dbService.js';
import * as geminiClient from '../utils/geminiClient.js';

// --- Mocking Section ---

// 1. הדמיית בסיס הנתונים והמחלקות בסופר
// הנתונים כאן מבוססים על המבנה והערכים בקובץ VECTOR_DB.SQL
const mockCategories = [
    { id: 37, name: 'חלב, שתייה חלבית, גלידות, ארטיקים, ביצים', row_index: 0, col_index: 4, gemini_embedding: [0.1, 0.9, 0.2] },
    { id: 35, name: 'פירות', row_index: 6, col_index: 3, gemini_embedding: [0.9, 0.1, 0.1] },
    { id: 18, name: 'עוגיות סנדוויץ\', עוגיות מצופות, חיוכים...', row_index: 1, col_index: 2, gemini_embedding: [0.4, 0.4, 0.9] },
    { id: 44, name: 'טורטיות, לחם, לחמניות, פיתות, פריכיות', row_index: 7, col_index: 4, gemini_embedding: [0.3, 0.3, 0.8] },
    { id: 1, name: 'סבונים, אבקת כביסה, שמפו...', row_index: 0, col_index: 0, gemini_embedding: [0.0, 0.0, 0.0] },
];

// 2. הדמיית פונקציית getEmbedding כדי למנוע קריאות רשת אמיתיות
// הוקטורים המדומים "מהונדסים" להיות קרובים סמנטית למחלקות המתאימות
const mockEmbeddings = {
    'יוגורט תות': [0.15, 0.85, 0.25], // הכי קרוב למחלקת החלב
    'תפוזים': [0.85, 0.15, 0.15],     // הכי קרוב למחלקת הפירות
    'עוגיות שוקולד': [0.35, 0.35, 0.85], // הכי קרוב למחלקת העוגיות
};

// 3. החלפת הפונקציות האמיתיות בפונקציות המדומות שלנו
dbService.getCategories = async () => {
    console.log("--- Mock: מחזיר רשימת מחלקות מהדמיית בסיס הנתונים ---");
    return mockCategories;
};

geminiClient.getEmbedding = async (text) => {
    console.log(`--- Mock: יוצר וקטור מדומיין עבור: "${text}" ---`);
    if (mockEmbeddings[text]) {
        return mockEmbeddings[text];
    }
    return [0.5, 0.5, 0.5]; // וקטור ברירת מחדל
};


// --- Pathfinding Logic ---

/**
 * מחשב את המרחק המנהטני (Manhattan distance) בין שתי נקודות ברשת.
 * @param {object} dep1 - מחלקה א' עם row_index ו-col_index.
 * @param {object} dep2 - מחלקה ב' עם row_index ו-col_index.
 * @returns {number} המרחק בין שתי המחלקות.
 */
function calculateDistance(dep1, dep2) {
    return Math.abs(dep1.row_index - dep2.row_index) + Math.abs(dep1.col_index - dep2.col_index);
}

/**
 * מוצא את המסלול הקצר ביותר בין רשימת מחלקות באמצעות אלגוריתם חמדן (Nearest Neighbor).
 * @param {Array<Object>} departments - מערך של אובייקטי מחלקות שצריך לבקר בהן.
 * @param {Object} startPoint - נקודת ההתחלה (למשל, הכניסה לסופר), { row_index: X, col_index: Y }.
 * @returns {Array<Object>} מערך מסודר של המחלקות לפי המסלול הקצר ביותר.
 */
function findShortestPath(departments, startPoint = { row_index: 0, col_index: 0 }) {
    if (departments.length === 0) return [];
    if (departments.length === 1) return departments;

    let unvisited = [...departments];
    let path = [];
    let currentNode = startPoint;

    while (unvisited.length > 0) {
        let nearest = unvisited.reduce((closest, node) => {
            const distance = calculateDistance(currentNode, node);
            if (distance < closest.minDistance) {
                return { node, minDistance: distance };
            }
            return closest;
        }, { node: null, minDistance: Infinity });

        path.push(nearest.node);
        currentNode = nearest.node;
        unvisited = unvisited.filter(dep => dep.id !== nearest.node.id);
    }

    return path;
}

// --- Test Execution ---
async function runSupermarketTest() {
    console.log("=============================================");
    console.log("🏁 מתחילים מבחן הליכה בסופרמרקט 🏁");
    console.log("=============================================\n");

    const shoppingList = ['יוגורט תות', 'תפוזים', 'עוגיות שוקולד'];
    console.log("🛒 רשימת קניות:", shoppingList.join(', '));
    console.log("\n--- שלב 1: מיפוי כל מוצר למחלקה המתאימה לו ---\n");

    const departmentPromises = shoppingList.map(async (product) => {
        const result = await findClosestCategory(product);
        const foundCategory = mockCategories.find(c => c.id === result.categoryId);
        console.log(`✅ המוצר "${product}" מופה למחלקת "${foundCategory.name}" (ID: ${foundCategory.id}, ציון: ${result.score.toFixed(2)})`);
        return foundCategory;
    });

    const foundDepartments = await Promise.all(departmentPromises);

    // סינון לקבלת רשימה ייחודית של מחלקות
    const uniqueDepartments = [...new Map(foundDepartments.map(dep => [dep.id, dep])).values()];

    console.log("\n--- שלב 2: מציאת מסלול ההליכה הקצר ביותר ---\n");
    console.log("מחלקות ייחודיות לביקור:", uniqueDepartments.map(d => d.name).join(' | '));

    // נניח שהכניסה לסופר היא בפינה (0,0)
    const entryPoint = { row_index: 0, col_index: 0 };
    const shortestPath = findShortestPath(uniqueDepartments, entryPoint);

    console.log("\n🏆 מסלול ההליכה המומלץ (מהכניסה) הוא:\n");
    const pathString = shortestPath.map(dep => `[${dep.row_index},${dep.col_index}] ${dep.name}`).join(' 🚶‍♂️ -> ');
    console.log(pathString);

    // בדיקה אוטומטית (Assertion)
    const expectedOrder = [18, 37, 35]; // ID של עוגיות -> חלב -> פירות
    const actualOrder = shortestPath.map(p => p.id);
    const isOrderCorrect = JSON.stringify(expectedOrder) === JSON.stringify(actualOrder);

    console.log("\n--- בדיקה אוטומטית של סדר המסלול ---");
    console.log(`הסדר הצפוי (לפי ID): ${expectedOrder.join(' -> ')}`);
    console.log(`הסדר בפועל (לפי ID): ${actualOrder.join(' -> ')}`);
    console.log(isOrderCorrect ? "✅ הבדיקה עברה! המסלול מחושב נכון." : "❌ הבדיקה נכשלה! סדר המסלול שגוי.");
    console.log("=============================================\n");
}

// הרצת הבדיקה
runSupermarketTest();