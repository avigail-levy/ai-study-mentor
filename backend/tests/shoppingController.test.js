// backend/tests/shoppingController.test.js
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// --- הגדרת Mocks עבור ES Modules ---
// ב-ESM חייבים להשתמש ב-unstable_mockModule לפני האימפורט של הקובץ הנבדק

// 1. Mock dbService
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

// 2. Mock assistant
jest.unstable_mockModule('../utils/assistant.js', () => ({
    extractProductsFromText: jest.fn(),
    extractProductsFromPDF: jest.fn(),
    extractProductsFromImage: jest.fn(),
}));

// 3. Mock geminiClient
jest.unstable_mockModule('../utils/geminiClient.js', () => ({
    getEmbedding: jest.fn(),
    generateAIResponse: jest.fn(),
}));

// 4. Mock pathfinding
jest.unstable_mockModule('../utils/pathfinding.js', () => ({
    calculateShortestPath: jest.fn(),
}));

// --- טעינה דינמית של הקבצים (חובה אחרי הגדרת ה-Mocks) ---
const shoppingController = await import('../controllers/shoppingController.js');
const dbService = await import('../models/dbService.js');
const assistant = await import('../utils/assistant.js');

describe('Shopping Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            file: null
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should authenticate user and return userId on success', async () => {
            req.body = { email: 'test@test.com', name: 'Test User' };
            const mockUserId = 55;
            dbService.findOrCreateUser.mockResolvedValue(mockUserId);

            await shoppingController.login(req, res);

            expect(dbService.findOrCreateUser).toHaveBeenCalledWith('test@test.com', 'Test User');
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                userId: mockUserId,
                message: 'User authenticated successfully'
            });
        });

        it('should return 400 if email is missing', async () => {
            req.body = { name: 'No Email' };
            
            await shoppingController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Email and name is required' });
            expect(dbService.findOrCreateUser).not.toHaveBeenCalled();
        });
    });

    describe('addItem', () => {
        it('should add an item successfully', async () => {
            req.body = { userId: 1, item_name: 'Milk' };
            dbService.addItemToRawList.mockResolvedValue(101);

            await shoppingController.addItem(req, res);

            expect(dbService.addItemToRawList).toHaveBeenCalledWith(1, 'Milk');
            expect(res.json).toHaveBeenCalledWith({ success: true, itemId: 101 });
        });

        it('should handle DB errors gracefully', async () => {
            req.body = { userId: 1, item_name: 'Error Item' };
            const error = new Error('DB Connection Failed');
            dbService.addItemToRawList.mockRejectedValue(error);

            await shoppingController.addItem(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to add item' });
        });
    });

    describe('addVoiceItems', () => {
        it('should process transcript and add multiple items', async () => {
            req.body = { userId: 1, transcript: 'חלב ולחם' };
            const mockProducts = ['חלב', 'לחם'];
            
            assistant.extractProductsFromText.mockResolvedValue(mockProducts);
            dbService.addItemToRawList.mockResolvedValueOnce(201).mockResolvedValueOnce(202);

            await shoppingController.addVoiceItems(req, res);

            expect(assistant.extractProductsFromText).toHaveBeenCalledWith('חלב ולחם');
            expect(dbService.addItemToRawList).toHaveBeenCalledTimes(2);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                items: mockProducts,
                message: `נוספו 2 מוצרים בהצלחה`
            });
        });

        it('should handle case where AI finds no products', async () => {
            req.body = { userId: 1, transcript: 'סתם דיבורים' };
            assistant.extractProductsFromText.mockResolvedValue([]);

            await shoppingController.addVoiceItems(req, res);

            expect(dbService.addItemToRawList).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ 
                success: true, 
                items: [], 
                message: "לא זוהו מוצרים" 
            });
        });
    });
});
