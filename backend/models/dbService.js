import { Pool } from 'pg';
import 'dotenv/config';

// *** חיבור למסד הנתונים PostgreSQL ***
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

// פונקציית עזר לנורמליזציה (כדי להתאים למה שנשמר ב-init_embeddings)
function normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 1e-6) {
        return vector.map(val => val / magnitude);
    }
    return vector;
}

// 1. מציאת הקטגוריה הקרובה ביותר לווקטור
export async function findClosestCategory(itemVector) {
    console.log("Searching for closest category for vector length:", itemVector.length);
    try {
        console.log(`Search Vector First 5 values: [${itemVector.slice(0, 5).join(', ')}]`);
        // נרמול הוקטור לפני החיפוש (חשוב לדיוק המרחק)
        const normalizedVector = normalizeVector(itemVector);
        
        // המרת הוקטור לפורמט מחרוזת
        const vectorString = `[${normalizedVector.join(',')}]`;
        
        const query = `
            SELECT id, name, gemini_embedding <-> $1 ::vector(768) AS distance
            FROM categories
            WHERE gemini_embedding IS NOT NULL
            ORDER BY distance ASC        
            LIMIT 1;
        `;
        
        const result = await pool.query(query, [vectorString]);
        
        if (result.rows.length === 0) {
            console.log("No categories found with embeddings");
            return null;
        }
        
        console.log("Closest category found:", {
            categoryId: result.rows[0].id,
            categoryName: result.rows[0].name,
            distance: result.rows[0].distance
        });
        
        return result.rows[0].id;
    } catch (error) {
        console.error("Error in findClosestCategory:", error);
        throw error;
    }
}

export async function getMappedItemsForPathfinding(userId) {
const query = `
SELECT i.id AS item_id,i.item_name,
c.row_index AS r,     
c.col_index AS c    
FROM user_shopping_items i
JOIN categories c ON i.mapped_category_id = c.id
WHERE i.user_id = $1 AND i.mapped_category_id IS NOT NULL
ORDER BY i.id;`;
const result = await pool.query(query, [userId]);
return result.rows;
}

// 3. עדכון הסדר המחושב ב-DB
export async function updateItemOrder(itemId, order) {
  await pool.query(
    'UPDATE user_shopping_items SET calculated_order = $1 WHERE id = $2',
    [order, itemId]
  );
}

// 4. שליפת רשימת קניות מסודרת
export async function getSortedShoppingList(userId) {
  const result = await pool.query(
    `SELECT id, item_name, calculated_order
     FROM user_shopping_items
     WHERE user_id = $1
     ORDER BY calculated_order, item_name`,
    [userId]
  );
  return result.rows;
}

// --- פונקציות ניהול רשימה גולמית ---

// 5. הוספת פריט גולמי לרשימה
export async function addItemToRawList(userId, itemName) {
  const query = `
    INSERT INTO user_shopping_items (user_id, item_name)
    VALUES ($1, $2)
    RETURNING id;
  `;
  const result = await pool.query(query, [userId, itemName]);
  return result.rows[0].id;

}
export async function getCategories() {
  const query = `
    select * from categories`;
  const result = await pool.query(query);
  return result.rows;
}

// 6. עדכון מיפוי פריט לקטגוריה
export async function updateItemMapping(categoryId,itemId) {
    try {
        const query = `
            UPDATE user_shopping_items
            SET mapped_category_id = $1, calculated_order = NULL
            WHERE id = $2;
        `;
        // חשוב: מאפסים את calculated_order כי המיפוי השתנה וצריך לחשב מחדש את המסלול.
        await pool.query(query, [categoryId, itemId]);
        console.log(`DB updated: Item ID ${itemId} mapped to Category ID ${categoryId}.`);
    } catch (error) {
        console.error("DB Error: Failed to update item mapping:", error.message);
        throw error; // זורק שגיאה כדי שהשרת יטפל בה
    }
}

// 7. קבלת פריטים לא ממופים
export async function getUnmappedItems(userId) {
  const query = `
    SELECT id, item_name
    FROM user_shopping_items
    WHERE user_id = $1 AND mapped_category_id IS NULL;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

// 8. יצירת משתמש חדש או שליפת קיים
export async function findOrCreateUser(email, fullName) {
  console.log("email--name",email,fullName);
  // מנסה למצוא את המשתמש
  let result = await pool.query(
    `SELECT id FROM users WHERE email = $1 AND full_name= $2`,
    [email,fullName]
  );
  if (result.rows.length > 0) return result.rows[0].id;

  // אם לא קיים – יוצרים חדש
  result = await pool.query(
    `INSERT INTO users (email, full_name) VALUES ($1, $2) RETURNING id`,
    [email, fullName]
  );
  return result.rows[0].id;
}

// 9. מחיקת כל הפריטים ברשימה של משתמש
export async function clearUserList(userId) {
  const query = `DELETE FROM user_shopping_items WHERE user_id = $1`;
  await pool.query(query, [userId]);
}