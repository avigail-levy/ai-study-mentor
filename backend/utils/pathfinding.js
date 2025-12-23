// הגדרת גודל המטריצה (לפי ה-SQL: אינדקסים 0-7 ו-0-4)
const ROWS = 8;
const COLS = 5;

// הגדרת חוקי המעבר: מעבר אופקי (בין עמודות) מותר רק בשורות אלו:
const ALLOWED_CROSS_ROWS = new Set([0, 3, 4]); 

/**
 * חישוב המסלול המלא בין שתי נקודות באמצעות BFS
 * מחזיר את המרחק ואת מערך הצעדים (fullPath).
 */
function getBFS_Path(start, end) {
    if (start.r === end.r && start.c === end.c) {
        return { distance: 0, fullPath: [] }; // כבר נמצאים בנקודה
    }

    // התור מכיל: מיקום נוכחי ומערך הצעדים שהובילו אליו
    const queue = [{ r: start.r, c: start.c, path: [] }];
    const visited = new Set();
    const startKey = `${start.r},${start.c}`;
    visited.add(startKey);

    const moves = [
        { dr: 1, dc: 0, label: '⬇️' },  // למטה (במטריצה r גדל) - שים לב: r גדל זה למטה ויזואלית
        { dr: -1, dc: 0, label: '⬆️' }, // למעלה (במטריצה r קטן)
        { dr: 0, dc: 1, label: '➡️' },  // ימינה
        { dr: 0, dc: -1, label: '⬅️' }  // שמאלה
    ];

    while (queue.length > 0) {
        const { r, c, path } = queue.shift();

        for (const move of moves) {
            const nr = r + move.dr;
            const nc = c + move.dc;

            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                // בדיקת חוקיות המעבר:
                // אם זזים אופקית (שינוי בעמודה), חייבים להיות בשורה מותרת
                if (move.dc !== 0 && !ALLOWED_CROSS_ROWS.has(r)) {
                    continue;
                }

                const newKey = `${nr},${nc}`;
                if (visited.has(newKey)) continue;

                // יצירת המסלול החדש
                const newPath = [...path, move.label];

                // אם הגענו ליעד
                if (nr === end.r && nc === end.c) {
                    return { distance: newPath.length, fullPath: newPath };
                }

                visited.add(newKey);
                queue.push({ r: nr, c: nc, path: newPath });
            }
        }
    }
    // אם לא נמצא מסלול (לא אמור לקרות אם הגרף קשיר)
    return { distance: Infinity, fullPath: [] }; 
}

/**
 * מציאת סדר הקניות האופטימלי וחישוב כיווני הגעה לכל מוצר
 * @param {object[]} itemCoordinates - רשימת המוצרים {item_id, r, c}
 * @returns {object} מפה של itemId -> {order, direction}
 */
export function calculateShortestPath(itemCoordinates) {
    if (itemCoordinates.length === 0) return {};
    
    // נקודת התחלה: כניסה (הנחה: שורה 0 עמודה 0 או דומה)
    const startPoint = { r: 1, c: 0 }; 
    let currentPoint = startPoint;
    
    // המרה בטוחה למספרים כדי למנוע בעיות השוואה
    let remainingItems = itemCoordinates.map(item => ({
        ...item,
        r: parseInt(item.r, 10),
        c: parseInt(item.c, 10)
    }));

    let calculatedOrderMap = {};
    let currentOrder = 1;

    while (remainingItems.length > 0) {
        let shortestDistance = Infinity;
        let nextItemIndex = -1;
        let bestPath = [];
        
        for (let i = 0; i < remainingItems.length; i++) {
            const item = remainingItems[i];
            const result = getBFS_Path(currentPoint, { r: item.r, c: item.c });
            
            // אופטימיזציה: אם המרחק הוא 0 (אנחנו כבר שם), קח את הפריט מיד!
            // זה מבטיח שפריטים מאותה קטגוריה יהיו צמודים ברשימה.
            if (result.distance === 0) {
                shortestDistance = 0;
                nextItemIndex = i;
                bestPath = []; // אין צעדים
                break; // אין טעם להמשיך לחפש, מצאנו את הכי קרוב שאפשר
            }

            if (result.distance < shortestDistance) {
                shortestDistance = result.distance;
                nextItemIndex = i;
                bestPath = result.fullPath;
            }
        }
        
        if (nextItemIndex !== -1) {
            const nextItem = remainingItems[nextItemIndex];
            
            // שמירת הסדר והמסלול המלא עבור הפריט
            calculatedOrderMap[nextItem.item_id] = {
                order: currentOrder++,
                fullPath: bestPath
            };
            
            // עדכון הנקודה הנוכחית למיקום המוצר שנאסף
            currentPoint = { r: nextItem.r, c: nextItem.c };
            
            // הסרת הפריט מהרשימה
            remainingItems.splice(nextItemIndex, 1);
        } else {
            // Fallback: אם ה-BFS נכשל (למשל יעד לא נגיש), ניקח את הפריט הראשון ברשימה
            // כדי לא להיתקע בלולאה אינסופית או לאבד פריטים.
            const nextItem = remainingItems[0];
            calculatedOrderMap[nextItem.item_id] = {
                order: currentOrder++,
                fullPath: ['❓']
            };
            currentPoint = { r: nextItem.r, c: nextItem.c };
            remainingItems.splice(0, 1);
        }
    }
    
    return calculatedOrderMap;
}
