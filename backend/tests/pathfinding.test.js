// backend/tests/pathfinding.test.js
import { describe, it, expect } from '@jest/globals';
import { calculateShortestPath } from '../utils/pathfinding.js';

describe('Pathfinding Algorithm (TSP Approximation)', () => {
    
    it('should return an empty object when input list is empty', () => {
        const result = calculateShortestPath([]);
        expect(result).toEqual({});
    });

    it('should calculate a valid order for a list of items', () => {
        // נכין רשימת פריטים מדומה עם קואורדינטות ידועות
        // נקודת ההתחלה באלגוריתם היא (1,0)
        const items = [
            { item_id: 101, r: 1, c: 1 }, // קרוב מאוד להתחלה (מרחק 1)
            { item_id: 102, r: 7, c: 4 }, // רחוק מאוד
            { item_id: 103, r: 1, c: 2 }  // קרוב ל-101 (מרחק 1 ממנו)
        ];

        const result = calculateShortestPath(items);

        // אנו מצפים לקבל אובייקט שממפה ID -> אובייקט עם order ו-fullPath
        expect(result).toHaveProperty('101');
        expect(result).toHaveProperty('102');
        expect(result).toHaveProperty('103');

        // בדיקת מבנה התוצאה החדש
        expect(result['101']).toHaveProperty('order');
        expect(result['101']).toHaveProperty('fullPath');
        expect(Array.isArray(result['101'].fullPath)).toBe(true);

        // בדיקת לוגיקה: 101 צריך להיות ראשון כי הוא הכי קרוב להתחלה (1,0)
        expect(result['101'].order).toBe(1);
        // 103 צריך להיות שני כי הוא שכן של 101
        expect(result['103'].order).toBe(2);
        // 102 הכי רחוק, צריך להיות אחרון
        expect(result['102'].order).toBe(3);
    });

    it('should handle items at the same location correctly', () => {
        const items = [
            { item_id: 1, r: 2, c: 2 },
            { item_id: 2, r: 2, c: 2 }
        ];
        const result = calculateShortestPath(items);
        
        // הסדר ביניהם לא קריטי, העיקר ששניהם יקבלו מספר
        expect(result['1']).toBeDefined();
        expect(result['2']).toBeDefined();
        expect(result['1'].order).toBeDefined();
        expect(result['2'].order).toBeDefined();
        expect(Object.keys(result).length).toBe(2);
        
        // וידוא שהמספרים הם 1 ו-2
        const orders = [result['1'].order, result['2'].order].sort();
        expect(orders).toEqual([1, 2]);
    });
});
