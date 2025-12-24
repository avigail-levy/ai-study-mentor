import fs from 'fs/promises';
import path from 'path';
import { extractProductsFromPDF, 
         extractProductsFromImage,
         extractProductsFromText } from '../utils/assistant.js';
import { getEmbedding, generateAIResponse } from '../utils/geminiClient.js';
import { calculateShortestPath } from '../utils/pathfinding.js';
import { findOrCreateUser,findClosestCategory,
         getMappedItemsForPathfinding,
         updateItemOrder,
         getSortedShoppingList,
         addItemToRawList, 
         updateItemMapping, 
         getUnmappedItems, 
         clearUserList,
         updateItemDB,
         deleteItemDB,
         getShoppingListDB
  } from '../models/dbService.js';
  

// --- לוגיקת אימות משתמש ---
export const login = async (req, res) => {
 try {
        const { email, name } = req.body;
        console.log("-----",email,name);

        if (!email||!name) {
            return res.status(400).json({ error: 'Email and name is required' });
        }

        // שימוש בפונקציה מה-dbService
        const userId = await findOrCreateUser(email, name || 'User');

        res.json({ 
            success: true, 
            userId: userId,
            message: 'User authenticated successfully'
        });
    } catch (error) {
        console.error('Login route error:', error);
        res.status(500).json({ error: 'Failed to authenticate user' });
    }
};
export const addItem = async (req, res) => {
     try {
            const { userId, item_name } = req.body;
            if (!userId || !item_name) {
                return res.status(400).json({ error: 'UserID and item name required' });
            }
            console.log("app.post(/api/list/add-item", userId, item_name);
            const itemId = await addItemToRawList(userId, item_name); 
            res.json({ success: true, itemId });
        } catch (error) {
            console.error('Add Item Error:', error);
            res.status(500).json({ error: 'Failed to add item' });
        }
};

export const addVoiceItems = async (req, res) => {
     try {
            const { userId, transcript } = req.body;
            if (!userId || !transcript) {
                return res.status(400).json({ error: 'UserID and transcript required' });
            }
    
            console.log("Gemini is analyzing transcript:", transcript);
    
            // 1. שימוש ב-Gemini כדי לפרק את הטקסט למערך של מוצרים
            const extractedProducts = await extractProductsFromText(transcript);
    
            if (!extractedProducts || extractedProducts.length === 0) {
                return res.json({ success: true, items: [], message: "לא זוהו מוצרים" });
            }
    
            // 2. הוספת כל מוצר בנפרד ל-Database
            const addedIds = [];
            for (const itemName of extractedProducts) {
                const itemId = await addItemToRawList(userId, itemName);
                addedIds.push(itemId);
            }
    
            res.json({ 
                success: true, 
                items: extractedProducts, 
                message: `נוספו ${extractedProducts.length} מוצרים בהצלחה` 
            });
    
        } catch (error) {
            console.error('Voice AI Route Error:', error);
            console.error('שגיאת ה-AI המלאה:', error);
            res.status(500).json({ error: 'Failed to process voice with AI' });
        }
    };


export const calculatePath = async (req, res) => {
    console.log("calculatePath",calculatePath);
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'UserID required' });
        }

        // 1. מיפוי (AI Mapping): טפל בפריטים לא ממופים
        const unmappedItems = await getUnmappedItems(userId);

        for (const item of unmappedItems) {
            try {
                const itemEmbedding = await getEmbedding(item.item_name);
                if (itemEmbedding) {
                    const categoryId = await findClosestCategory(itemEmbedding);
                    if (categoryId) {
                        await updateItemMapping(categoryId, item.id);
                    }
                }
            } catch (e) {
                console.error(`Mapping error for ${item.item_name}:`, e.message);
            }
        }

        // 2. שליפת פריטים ממופים לחישוב מסלול
        const mappedItems = await getMappedItemsForPathfinding(userId);

        if (mappedItems.length === 0) {
            return res.json({ success: true, list: [], answer: 'הרשימה ריקה.' });
        }

        // 3. חישוב מסלול (מחזיר אובייקט עם סדר וכיוון לכל ID)
        const calculatedOrderMap = calculateShortestPath(mappedItems);

        // 4. עדכון הסדר המחושב ב-DB (ה-DB שומר רק את המספר, לא את החץ)
        for (const itemId in calculatedOrderMap) {
            // תיקון קריטי: שולחים רק את ה-order (מספר) לפונקציית ה-DB
            await updateItemOrder(parseInt(itemId), calculatedOrderMap[itemId].order);
        }

        // 5. שליפת הרשימה המסודרת מה-DB
        const finalSortedList = await getSortedShoppingList(userId); 

        // 6. מיזוג החצים לתוך הרשימה הסופית (בזיכרון, בלי לשמור ב-DB)
        const listWithArrows = finalSortedList.map(item => {
            // אנחנו משתמשים ב-ID כדי למצוא את המסלול שחושב באלגוריתם
            const pathInfo = calculatedOrderMap[item.id] || { fullPath: [] };
            return {
                ...item,
                fullPath: pathInfo.fullPath // מעבירים את המערך המלא ל-Frontend
            };
        });

        res.json({
            success: true,
            list: listWithArrows, // הרשימה חוזרת עם חצים!
        });

    } catch (error) {
        console.error('Error in calculate-path route:', error);
        res.status(500).json({ error: 'Search and Pathfinding error' });
    }
};
export const uploadAndCalculate = async (req, res) => {
    console.log("uploadAndCalculate");
     if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
    
        const { userId } = req.body;
        const filePath = req.file.path;
        const mimeType = req.file.mimetype;
    
        try {
            // --- שלב 1: חילוץ טקסט בעזרת Gemini לפי סוג הקובץ ---
            let extractedProducts = [];
            
            if (mimeType === 'application/pdf') {
                console.log("Processing PDF...");
                extractedProducts = await extractProductsFromPDF(filePath);
            } else if (mimeType.startsWith('image/')) {
                console.log("Processing Image...");
                extractedProducts = await extractProductsFromImage(filePath, mimeType);
            } else {
                throw new Error("Unsupported file type. Please upload PDF or Image.");
            }
    
            if (!extractedProducts || extractedProducts.length === 0) {
                return res.json({ success: true, message: "לא נמצאו מוצרים בקובץ", list: [] });
            }
    
            // --- שלב 2: הוספת המוצרים הגולמיים ל-DB ---
            console.log(`Adding ${extractedProducts.length} items to DB...`);
            for (const itemName of extractedProducts) {
                await addItemToRawList(userId, itemName);
            }
    
            // --- שלב 3: הרצת לוגיקת המיפוי והחישוב (העתקה מה-calculate-path) ---
            // אנחנו מריצים את זה כאן כדי שהמשתמש יקבל תוצאה מידית
            
            const unmappedItems = await getUnmappedItems(userId);
    
            for (const item of unmappedItems) {
                try {
                    const itemEmbedding = await getEmbedding(item.item_name);
                    if (itemEmbedding) {
                        const categoryId = await findClosestCategory(itemEmbedding);
                        if (categoryId) {
                            await updateItemMapping(categoryId, item.id);
                        }
                    }
                } catch (e) {
                    console.error(`Mapping error for ${item.item_name}:`, e.message);
                }
            }
    
            // --- שלב 4: חישוב המסלול הסופי ---
            const mappedItems = await getMappedItemsForPathfinding(userId);
            
            if (mappedItems.length > 0) {
                const calculatedOrderMap = calculateShortestPath(mappedItems);
                for (const itemId in calculatedOrderMap) {
                    // תיקון קריטי: חילוץ ה-order מתוך האובייקט למניעת שגיאת DB
                    await updateItemOrder(parseInt(itemId), calculatedOrderMap[itemId].order);
                }
            }
    
            const finalSortedList = await getSortedShoppingList(userId);
            
            // מיזוג המסלול המלא לתוך הרשימה הסופית לפני השליחה ללקוח
            const mappedItemsForResponse = await getMappedItemsForPathfinding(userId);
            const calculatedOrderMap = calculateShortestPath(mappedItemsForResponse);
            
            const listWithPaths = finalSortedList.map(item => {
                const pathInfo = calculatedOrderMap[item.id] || { fullPath: [] };
                return { ...item, fullPath: pathInfo.fullPath };
            });
            
            // סיכום AI קצר
            const pathSummary = finalSortedList.map(item => item.item_name).join(' -> ');
            const aiSummary = await generateAIResponse(`הנה הרשימה שחילצתי מהקובץ, מסודרת לפי מסלול הליכה: ${pathSummary}`);
    
            // --- שלב 5: שליחת תשובה סופית ---
            res.json({
                success: true,
                message: 'הקובץ עובד והמסלול חושב',
                list: listWithPaths, // שולחים את הרשימה עם המסלולים המלאים
                answer: aiSummary
            });
    
        } catch (error) {
            console.error('Full Process Error:', error);
            res.status(500).json({ error: error.message || 'Failed to process file' });
        } finally {
            // מחיקת הקובץ הזמני
            await fs.unlink(filePath).catch(err => console.error("Temp file delete error:", err));
        }
    };
    // בקובץ shoppingController.js
export const getShoppingListWithDirections = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // קבלת רשימת הפריטים המסודרת
        const sortedItems = await getSortedShoppingList(userId);
        
        // קבלת נתיב המלא
        const mappedItems = await getMappedItemsForPathfinding(userId);
        const { directions } = calculateShortestPath(mappedItems);
        
        // מיפוי ה-directions לפי סדר הפריטים
        const itemsWithDirections = sortedItems.map((item, index) => {
            const direction = index < directions.length ? 
                directions[index].direction : 
                'הגעת ליעד הסופי';
                
            return {
                ...item,
                direction: direction
            };
        });

        res.json({
            success: true,
            items: itemsWithDirections
        });

    } catch (error) {
        console.error('Error getting shopping list with directions:', error);
        res.status(500).json({ error: 'שגיאה בשליפת רשימת הקניות' });
    }
};

export const clearList = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'UserID required' });
        }

        await clearUserList(userId);
        res.json({ success: true, message: 'Shopping list cleared successfully' });
    } catch (error) {
        console.error('Clear List Error:', error);
        res.status(500).json({ error: 'Failed to clear list' });
    }
};
// backend/controllers/shoppingListController.js

// Get user's shopping list
export const getShoppingList = async (req, res) => {
    console.log("----------------------------")
    const { userId } = req.params;
    try {
        const items = await getShoppingListDB(userId);
        res.json(items);
    } catch (error) {
        console.error('Error fetching shopping list:', error);
        res.status(500).json({ error: 'Failed to fetch shopping list' });
    }
};

// Delete an item
export const deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        await deleteItemDB(id);
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
};

// Update an item
export const updateItem = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedItem = await updateItemDB(id);
        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
};