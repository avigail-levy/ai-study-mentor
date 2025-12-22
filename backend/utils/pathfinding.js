// הגדרת גודל המטריצה (8 שורות, 5 עמודות)
const ROWS = 8;
const COLS = 5;

// הגדרת חוקי המעבר: קפיצה בין שורות מותרת רק בעמודות 0, 3, ו-4.
const ALLOWED_CROSS_COLS = new Set([0, 3, 4]); 

/**
 * חישוב המרחק והכיוון הקצר ביותר בין שתי נקודות באמצעות BFS
 */
function getBFS_Distance(start, end) {
    if (start.r === end.r && start.c === end.c) {
        return { distance: 0, direction: '📍' }; // כבר נמצאים בנקודה
    }

    const queue = [{ r: start.r, c: start.c, dist: 0 }];
    const visited = new Set();
    const startKey = `${start.r},${start.c}`;
    visited.add(startKey);

    const moves = [
        { dr: 1, dc: 0, label: '⬆️' },  // קדימה (במטריצה r גדל)
        { dr: -1, dc: 0, label: '⬇️' }, // אחורה (במטריצה r קטן)
        { dr: 0, dc: 1, label: '➡️' },  // ימינה
        { dr: 0, dc: -1, label: '⬅️' }  // שמאלה
    ];

    while (queue.length > 0) {
        const { r, c, dist } = queue.shift();

        for (const move of moves) {
            const nr = r + move.dr;
            const nc = c + move.dc;

            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                const newKey = `${nr},${nc}`;
                
                if (visited.has(newKey)) continue;

                // בדיקת מגבלת מעבר אופקי
                if (c !== nc && !ALLOWED_CROSS_COLS.has(c) && !ALLOWED_CROSS_COLS.has(nc)) {
                // // בדיקת מגבלת מעבר אופקי (קפיצה בין עמודות שונות)
                // const isMainAisle = r === 0 || r === ROWS - 1;
                // if (!isMainAisle && c !== nc && !ALLOWED_CROSS_COLS.has(c) && !ALLOWED_CROSS_COLS.has(nc)) {
                //     // אם מנסים לעבור רוחבית באזורים לא מורשים, המעבר נחסם.
                    continue; 
                }

                // אם הגענו ליעד - מחשבים את הכיוון הכללי ביחס לנקודת ההתחלה המקורית
                if (nr === end.r && nc === end.c) {
                    let finalDirection = '⬆️'; // ברירת מחדל
                    
                    if (end.c > start.c) finalDirection = '➡️';
                    else if (end.c < start.c) finalDirection = '⬅️';
                    else if (end.r > start.r) finalDirection = '⬆️';
                    else if (end.r < start.r) finalDirection = '⬇️';
                    
                    return { distance: dist + 1, direction: finalDirection };
                }

                visited.add(newKey);
                queue.push({ r: nr, c: nc, dist: dist + 1 });
            }
        }
    }
    return { distance: Infinity, direction: '' }; 
}

/**
 * מציאת סדר הקניות האופטימלי וחישוב כיווני הגעה לכל מוצר
 * @param {object[]} itemCoordinates - רשימת המוצרים {item_id, r, c}
 * @returns {object} מפה של itemId -> {order, direction}
 */
export function calculateShortestPath(itemCoordinates) {
    if (itemCoordinates.length === 0) return {};
    
    // נקודת התחלה: כניסה
    const startPoint = { r: 1, c: 0 }; 
    let currentPoint = startPoint;
    let remainingItems = [...itemCoordinates];
    let calculatedOrderMap = {};
    let currentOrder = 1;

    while (remainingItems.length > 0) {
        let shortestDistance = Infinity;
        let nextItemIndex = -1;
        let bestDirection = '';
        
        for (let i = 0; i < remainingItems.length; i++) {
            const item = remainingItems[i];
            const result = getBFS_Distance(currentPoint, { r: item.r, c: item.c });
            
            if (result.distance < shortestDistance) {
                shortestDistance = result.distance;
                nextItemIndex = i;
                bestDirection = result.direction;
            }
        }
        
        if (nextItemIndex !== -1) {
            const nextItem = remainingItems[nextItemIndex];
            
            // שמירת הסדר והחץ המחושב עבור הפריט
            calculatedOrderMap[nextItem.item_id] = {
                order: currentOrder++,
                direction: bestDirection
            };
            
            // עדכון הנקודה הנוכחית למיקום המוצר שנאסף
            currentPoint = { r: nextItem.r, c: nextItem.c };
            
            // הסרת הפריט מהרשימה
            remainingItems.splice(nextItemIndex, 1);
        } else {
            break;
            // אם לא נמצאה קטגוריה קרובה (במקרה של לוגיקה שגויה או דאטה חסר)
            // במקום לשבור, ניקח את הפריט הבא בתור כדי להבטיח שכל הפריטים יוחזרו
            // const nextItem = remainingItems[0];
            // calculatedOrderMap[nextItem.item_id] = currentOrder++;
            // currentPoint = nextItem;
            // remainingItems.splice(0, 1);
        }
    }
    
    return calculatedOrderMap;
}