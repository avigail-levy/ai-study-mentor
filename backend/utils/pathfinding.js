// backend/pathfinding.js

// הגדרת גודל המטריצה (8 שורות, 5 עמודות)
const ROWS = 8;
const COLS = 5;

// הגדרת חוקי המעבר: קפיצה בין שורות מותרת רק בעמודות 0, 3, ו-4.
// המעבר מבוצע תמיד בצעד אחד, אלא אם כן המעבר אסור רוחבית.
const ALLOWED_CROSS_COLS = new Set([0, 3, 4]); 

/**
 * חישוב המרחק הקצר ביותר בין שתי נקודות (R1, C1) ל- (R2, C2) באמצעות BFS
 * תוך שימוש במגבלות המעבר של הסופר.
 * * @param {object} start - נקודת התחלה {r, c}
 * @param {object} end - נקודת סיום {r, c}
 * @returns {number} המרחק הקצר ביותר
 */
function getBFS_Distance(start, end) {
    if (start.r === end.r && start.c === end.c) return 0;

    const queue = [{ r: start.r, c: start.c, dist: 0 }];
    const visited = new Set();
    const startKey = `${start.r},${start.c}`;
    visited.add(startKey);

    const moves = [
        { dr: 1, dc: 0 }, { dr: -1, dc: 0 }, // מעבר אנכי (תמיד מותר)
        { dr: 0, dc: 1 }, { dr: 0, dc: -1 }  // מעבר אופקי
    ];

    while (queue.length > 0) {
        const { r, c, dist } = queue.shift();

        for (const move of moves) {
            const nr = r + move.dr;
            const nc = c + move.dc;

            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                const newKey = `${nr},${nc}`;
                
                if (visited.has(newKey)) continue;

                // בדיקת מגבלת מעבר אופקי (קפיצה בין עמודות שונות)
                const isMainAisle = r === 0 || r === ROWS - 1;
                if (!isMainAisle && c !== nc && !ALLOWED_CROSS_COLS.has(c) && !ALLOWED_CROSS_COLS.has(nc)) {
                    // אם מנסים לעבור רוחבית באזורים לא מורשים, המעבר נחסם.
                    continue; 
                }

                if (nr === end.r && nc === end.c) {
                    return dist + 1; // הגענו ליעד
                }

                visited.add(newKey);
                queue.push({ r: nr, c: nc, dist: dist + 1 });
            }
        }
    }
    // אם לא נמצא מסלול (לא אמור לקרות במטריצה רגילה)
    return Infinity; 
}


/**
 * מציאת סדר הקניות האופטימלי באמצעות Nearest Neighbor (קירוב ל-TSP)
 * * @param {object[]} itemCoordinates - רשימת המוצרים הממופים {item_id, r, c}
 * @returns {object} מפה של itemId -> order (הסדר החדש)
 */
export function calculateShortestPath(itemCoordinates) {
    if (itemCoordinates.length === 0) return {};
    
    // נקודת התחלה: קופה/כניסה (נניח R=0, C=4)
    const startPoint = { r: 1, c: 0, id: -1 }; 
    let currentPoint = startPoint;
    let remainingItems = [...itemCoordinates];
    let calculatedOrderMap = {};
    let currentOrder = 1;

    while (remainingItems.length > 0) {
        let shortestDistance = Infinity;
        let nextItemIndex = -1;
        
        for (let i = 0; i < remainingItems.length; i++) {
            const item = remainingItems[i];
            const dist = getBFS_Distance(currentPoint, { r: item.r, c: item.c });
            
            if (dist < shortestDistance) {
                shortestDistance = dist;
                nextItemIndex = i;
            }
        }
        
        if (nextItemIndex !== -1) {
            const nextItem = remainingItems[nextItemIndex];
            
            // שמירת הסדר החדש עבור הפריט
            calculatedOrderMap[nextItem.item_id] = currentOrder++;
            
            // עדכון הנקודה הנוכחית
            currentPoint = nextItem;
            
            // הסרת הפריט מרשימת הפריטים שנותרו
            remainingItems.splice(nextItemIndex, 1);
        } else {
            // אם לא נמצאה קטגוריה קרובה (במקרה של לוגיקה שגויה או דאטה חסר)
            // במקום לשבור, ניקח את הפריט הבא בתור כדי להבטיח שכל הפריטים יוחזרו
            const nextItem = remainingItems[0];
            calculatedOrderMap[nextItem.item_id] = currentOrder++;
            currentPoint = nextItem;
            remainingItems.splice(0, 1);
        }
    }
    
    return calculatedOrderMap;
}
