import request from 'supertest';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// --- הגדרת Mocks (חובה לפני האימפורט של ה-app) ---

// 1. Mock dbService - כדי לא לכתוב ל-DB האמיתי
jest.unstable_mockModule('../models/dbService.js', () => ({
    findOrCreateUser: jest.fn(),
    addItemToRawList: jest.fn(),
    findClosestCategory: jest.fn(),
    getMappedItemsForPathfinding: jest.fn(),
    updateItemOrder: jest.fn(),
    getSortedShoppingList: jest.fn(),
    updateItemMapping: jest.fn(),
    getUnmappedItems: jest.fn(),
}));

// 2. Mock AI Services - כדי לא לפנות ל-Gemini
jest.unstable_mockModule('../utils/assistant.js', () => ({
    extractProductsFromText: jest.fn(),
    extractProductsFromPDF: jest.fn(),
    extractProductsFromImage: jest.fn(),
}));
jest.unstable_mockModule('../utils/geminiClient.js', () => ({
    getEmbedding: jest.fn(),
    generateAIResponse: jest.fn(),
}));
jest.unstable_mockModule('../utils/pathfinding.js', () => ({
    calculateShortestPath: jest.fn(),
}));

// --- טעינה דינמית של האפליקציה וה-Mocks ---
const { app } = await import('../server.js');
const dbService = await import('../models/dbService.js');
const assistant = await import('../utils/assistant.js');
const pathfinding = await import('../utils/pathfinding.js');

describe('API Integration Tests', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/list/add-item', () => {
        it('should add an item successfully and return 200', async () => {
            // Arrange: הכנת התשובה המדומה מה-DB
            const mockItemId = 123;
            dbService.addItemToRawList.mockResolvedValue(mockItemId);

            // Act: שליחת בקשת HTTP אמיתית לשרת (ללא הרצת השרת בפועל)
            const response = await request(app)
                .post('/api/list/add-item')
                .send({ userId: 1, item_name: 'Banana' })
                .set('Content-Type', 'application/json');

            // Assert: בדיקת התשובה
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ success: true, itemId: mockItemId });
            
            // וידוא שהקונטרולר קרא לפונקציה הנכונה ב-Service
            expect(dbService.addItemToRawList).toHaveBeenCalledWith(1, 'Banana');
        });

        it('should return 400 if parameters are missing', async () => {
            const response = await request(app)
                .post('/api/list/add-item')
                .send({ userId: 1 }); // חסר item_name

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    // הנחה: הנתיב ללוגין הוא /api/login או /api/auth/login. 
    // אם הנתיב שונה אצלך ב-shoppingRoutes, יש לעדכן כאן.
    describe('POST /api/auth/login', () => {
        it('should authenticate user', async () => {
            const mockUserId = 55;
            dbService.findOrCreateUser.mockResolvedValue(mockUserId);

            // נסה את הנתיב הסביר ביותר, עדכן אם צריך
            const response = await request(app)
                .post('/api/auth/login') 
                .send({ email: 'test@integration.com', name: 'Integration User' });

            // אם הנתיב לא קיים (404), הבדיקה תיכשל ותדע שצריך לעדכן את ה-URL בבדיקה
            expect(response.statusCode).not.toBe(404); 
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('userId', mockUserId);
        });
    });

    describe('POST /api/voice-add', () => {
        it('should process transcript and return items', async () => {
            // Arrange
            const mockItems = ['חלב', 'לחם'];
            assistant.extractProductsFromText.mockResolvedValue(mockItems);
            dbService.addItemToRawList.mockResolvedValue(1);

            // Act
            // הערה: וודא שהנתיב כאן תואם לנתיב שהגדרת ב-shoppingRoutes.js עבור addVoiceItems
            const response = await request(app)
                .post('/api/voice-add')
                .send({ userId: 1, transcript: 'חלב ולחם' });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(expect.objectContaining({ success: true, items: mockItems }));
        });
    });

    describe('POST /api/calculate-path', () => {
        it('should calculate path and return sorted list', async () => {
            // Arrange
            const userId = 1;
            // מדמים שאין פריטים חדשים למיפוי (כדי לפשט את הבדיקה)
            dbService.getUnmappedItems.mockResolvedValue([]); 
            // מדמים שיש פריטים שכבר מופו ב-DB
            const mockMappedItems = [{ item_id: 10, r: 0, c: 0 }];
            dbService.getMappedItemsForPathfinding.mockResolvedValue(mockMappedItems);
            // מדמים את תוצאת האלגוריתם (כדי לוודא שהקונטרולר משתמש בו)
            pathfinding.calculateShortestPath.mockReturnValue({ '10': 1 });
            // מדמים את הרשימה הסופית שה-DB מחזיר
            const mockSortedList = [{ item_name: 'Apple', calculated_order: 1 }];
            dbService.getSortedShoppingList.mockResolvedValue(mockSortedList);

            // Act
            const response = await request(app).post('/api/calculate-path').send({ userId });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.list).toEqual(mockSortedList);
            expect(dbService.updateItemOrder).toHaveBeenCalledWith(10, 1);
        });
    });
});