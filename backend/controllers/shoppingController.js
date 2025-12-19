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
      try {
            const { userId } = req.body;
            if (!userId) {
                return res.status(400).json({ error: 'UserID required' });
            }
    
            // 1. מיפוי (AI Mapping): טפל בפריטים לא ממופים
            const unmappedItems = await getUnmappedItems(userId); // פונקציה לממש ב-dbService
    
            for (const item of unmappedItems) {
                try {
                    console.log(`Attempting to map item: ${item.item_name} (ID: ${item.id})`);
                    
                    // שלב 1: קבלת ה-Embedding מה-AI
                    const itemEmbedding = await getEmbedding(item.item_name);
    
                    if (!itemEmbedding) {
                        console.error(`Failed to get embedding for: ${item.item_name}. Skipping.`);
                        continue;
                    }
                    // שלב 2: מציאת הקטגוריה הקרובה ביותר (ב-DB)
                    const categoryId = await findClosestCategory(itemEmbedding);
                    // const categoryId = await findClosestCategory(item.item_name).categoryId;
    
                    if (categoryId) {
                        // עדכון ה-DB עם ה-mapped_category_id
                        await updateItemMapping(categoryId,item.id); 
                        console.log(`Successfully mapped ${item.item_name} to Category ID: ${categoryId}`);
                    } else {
                        console.log(`No closest category found for: ${item.item_name}. Skipping.`);
                    }
                } catch (e) {
                    // קריטי: אם יש שגיאה ב-API של Gemini או בחיבור ל-DB.
                    console.error(`Critical error during mapping of ${item.item_name}:`, e.message);
                    // ממשיכים לפריט הבא, כדי לא להפיל את כל התהליך.
                }
            }
    
            // 2. הכנת קואורדינטות: שלוף את כל הפריטים הממופים והקואורדינטות שלהם (R, C)
            const mappedItems = await getMappedItemsForPathfinding(userId);
    
            // *** לוודא שמופעל מיפוי לאחר הלולאה, למקרה שהצליחו מיפויים בסיבוב הזה ***
            // שלוף שוב, רק כדי לוודא ש-mappedItems מכיל את כל הפריטים שמופו כרגע
            // (אם הלוגיקה של getUnmappedItems לא משתנה בין קריאות)
    
            if (mappedItems.length === 0) {
                return res.json({ success: true, list: [], answer: 'הרשימה ריקה או שעדיין לא מופתה בהצלחה.' });
            }
    
            // 3. חישוב מסלול (Pathfinding)
            const calculatedOrderMap = calculateShortestPath(mappedItems);
    
            // 4. עדכון הסדר המחושב ב-DB
            for (const itemId in calculatedOrderMap) {
                await updateItemOrder(parseInt(itemId), calculatedOrderMap[itemId]);
            }
    
            // 5. שליפת הרשימה המסודרת והחזרה למשתמש
            const finalSortedList = await getSortedShoppingList(userId); 
    
            // סינתזת תשובה סופית
            const pathSummary = finalSortedList.map(item => item.item_name).join(' -> ');
            const prompt = `המסלול הקצר ביותר לרשימת הקניות שלך הוא: ${pathSummary}.`;
            
            // let aiSummary;
            // try {
            //     aiSummary = await generateAIResponse(prompt);
            // } catch (e) {
            //     console.error("Failed to generate AI summary:", e.message);
            //     aiSummary = `נכשל ליצור סיכום AI, אך המסלול חושב בהצלחה: ${pathSummary}.`;
            // }
    
            res.json({
                success: true,
                // answer: aiSummary,
                list: finalSortedList,
            });
        } catch (error) {
            console.error('Error in calculate-path route:', error);
            res.status(500).json({ error: 'Search and Pathfinding error' });
        }
    };
export const uploadAndCalculate = async (req, res) => {
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
                    await updateItemOrder(parseInt(itemId), calculatedOrderMap[itemId]);
                }
            }
    
            const finalSortedList = await getSortedShoppingList(userId);
            
            // סיכום AI קצר
            const pathSummary = finalSortedList.map(item => item.item_name).join(' -> ');
            const aiSummary = await generateAIResponse(`הנה הרשימה שחילצתי מהקובץ, מסודרת לפי מסלול הליכה: ${pathSummary}`);
    
            // --- שלב 5: שליחת תשובה סופית ---
            res.json({
                success: true,
                message: 'הקובץ עובד והמסלול חושב',
                list: finalSortedList,
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
