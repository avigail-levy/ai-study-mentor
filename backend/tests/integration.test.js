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
    clearUserList: jest.fn(),
    getCategories: jest.fn(),
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
const geminiClient = await import('../utils/geminiClient.js');
const pathfinding = await import('../utils/pathfinding.js');

describe('API Integration Tests', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/list/add-item', () => {
        it('should add an item successfully and return 200', async () => {
            // Arrange
            const mockItemId = 123;
            dbService.addItemToRawList.mockResolvedValue(mockItemId);

            // Act
            const response = await request(app)
                .post('/api/list/add-item')
                .send({ userId: 1, item_name: 'Banana' })
                .set('Content-Type', 'application/json');

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ success: true, itemId: mockItemId });
            expect(dbService.addItemToRawList).toHaveBeenCalledWith(1, 'Banana');
        });

        it('should return 400 if parameters are missing', async () => {
            const response = await request(app)
                .post('/api/list/add-item')
                .send({ userId: 1 }); 

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should authenticate user', async () => {
            const mockUserId = 55;
            dbService.findOrCreateUser.mockResolvedValue(mockUserId);

            const response = await request(app)
                .post('/api/auth/login') 
                .send({ email: 'test@integration.com', name: 'Integration User' });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('userId', mockUserId);
        });
    });

    describe('POST /api/list/add-voice-items', () => {
        it('should process transcript and return items', async () => {
            const mockItems = ['milk', 'bread'];
            assistant.extractProductsFromText.mockResolvedValue(mockItems);
            dbService.addItemToRawList.mockResolvedValue(1);

            const response = await request(app)
                .post('/api/list/add-voice-items')
                .send({ userId: 1, transcript: 'milk and bread' });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(expect.objectContaining({ success: true, items: mockItems }));
            expect(dbService.addItemToRawList).toHaveBeenCalledTimes(2);
        });
    });

    describe('POST /api/calculate-path', () => {
        it('should calculate path and return sorted list', async () => {
            const userId = 1;
            dbService.getUnmappedItems.mockResolvedValue([]); 
            const mockMappedItems = [{ item_id: 10, r: 0, c: 0 }];
            dbService.getMappedItemsForPathfinding.mockResolvedValue(mockMappedItems);
            
            // Mock pathfinding to return object with order and fullPath
            pathfinding.calculateShortestPath.mockReturnValue({ '10': { order: 1, fullPath: ['⬇️'] } });
            
            const mockSortedList = [{ id: 10, item_name: 'Apple', calculated_order: 1 }];
            dbService.getSortedShoppingList.mockResolvedValue(mockSortedList);

            const response = await request(app).post('/api/calculate-path').send({ userId });

            expect(response.statusCode).toBe(200);
            // בדיקה שהרשימה כוללת את fullPath שהקונטרולר ממזג
            expect(response.body.list).toEqual([{ 
                id: 10, 
                item_name: 'Apple', 
                calculated_order: 1, 
                fullPath: ['⬇️'] 
            }]);
            // בדיקה שהקונטרולר שולח רק את המספר (order) ל-DB
            expect(dbService.updateItemOrder).toHaveBeenCalledWith(10, 1);
        });
    });

    describe('POST /api/list/clear', () => {
        it('should clear user list', async () => {
            dbService.clearUserList.mockResolvedValue();

            const response = await request(app)
                .post('/api/list/clear')
                .send({ userId: 1 });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(dbService.clearUserList).toHaveBeenCalledWith(1);
        });
    });

    describe('POST /api/upload-and-calculate', () => {
        it('should process uploaded PDF and return calculated path', async () => {
            const userId = 1;
            const mockExtracted = ['Milk'];
            
            assistant.extractProductsFromPDF.mockResolvedValue(mockExtracted);
            dbService.addItemToRawList.mockResolvedValue(1);
            dbService.getUnmappedItems.mockResolvedValue([]);
            dbService.getMappedItemsForPathfinding.mockResolvedValue([{ item_id: 1, r: 0, c: 0 }]);
            pathfinding.calculateShortestPath.mockReturnValue({ '1': { order: 1, fullPath: [] } });
            dbService.getSortedShoppingList.mockResolvedValue([{ id: 1, item_name: 'Milk', calculated_order: 1 }]);
            geminiClient.generateAIResponse.mockResolvedValue('AI Summary');

            const response = await request(app)
                .post('/api/upload-and-calculate')
                .field('userId', userId)
                .attach('file', Buffer.from('dummy pdf'), { filename: 'test.pdf', contentType: 'application/pdf' });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(assistant.extractProductsFromPDF).toHaveBeenCalled();
            expect(response.body.list).toHaveLength(1);
            expect(response.body.answer).toBe('AI Summary');
        });
    });
});
