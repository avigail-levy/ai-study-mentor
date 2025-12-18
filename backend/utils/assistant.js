import { GoogleGenAI, Type } from '@google/genai';
import * as fs from 'fs';
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
 

// Helper - file to Gemini Part (נשארת ללא שינוי)
export function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString('base64'),
            mimeType
        }
    };
}

/**
 * הגדרת הסכימה (Schema) המשותפת: תמיד דורשים מערך של שמות מוצרים נקיים ב-JSON
 */
const SHOPPING_LIST_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        products: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Clean names of products'
        }
    },
    required: ["products"]
};


// --- פונקציות חילוץ וניקוי קלט ---

/**
 * פרומפט בסיסי לניקוי והוצאת שמות מוצרים מתוך טקסט חופשי.
 * * @param {string} rawText - הטקסט הגולמי של רשימת הקניות (נקי או מבולגן).
 * @returns {Promise<string[]>} - מערך של שמות מוצרים נקיים.
 */
async function extractProducts(rawText) {
    if (!rawText || rawText.trim() === '') return [];
    
    // הוראה ממוקדת ל-AI באמצעות System Instruction (נותן תוצאות טובות יותר)
    const systemInstruction = "You are a shopping list data extractor. Your task is to extract every product mentioned in the input and return ONLY a JSON array of clean, singular product names, ignoring quantities, brands, emotional context, or specific instructions. For example, '2 יחידות חלב 3%' should become 'חלב'.";

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: rawText,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: SHOPPING_LIST_SCHEMA,
        },
    });

    try {
        const jsonResponse = JSON.parse(response.text.trim());
        return jsonResponse.products || [];
    } catch (e) {
        console.error("Error parsing AI JSON response:", e);
        // במקרה של תקלה בפלט, ניתן לנסות ולפרש את הפלט כטקסט פשוט או להחזיר מערך ריק.
        return []; 
    }
}


// --- פונקציות קצה (Multi-Modal) ---

/**
 * 1. חילוץ רשימת מוצרים מקובץ PDF (למשל, חשבונית או קטלוג).
 * * @param {string} path - נתיב לקובץ PDF.
 * @returns {Promise<string[]>} - מערך של שמות מוצרים נקיים.
 */
export async function extractProductsFromPDF(path) {
    const pdfPart = fileToGenerativePart(path, 'application/pdf');
    const systemPrompt = `You are a shopping list data extractor. 
    Extract all product names from the attached document and return them as a clean JSON list.`;
    
    // נשתמש בפונקציית העזר כדי להבטיח את מבנה הפלט.
    const rawTextResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [pdfPart, systemPrompt],
        config: {
            responseMimeType: "application/json",
            responseSchema: SHOPPING_LIST_SCHEMA,
        },
    });

    try {
        const jsonResponse = JSON.parse(rawTextResponse.text.trim());
        return jsonResponse.products || [];
    } catch (e) {
        throw new Error("Failed to extract products from PDF.");
    }
}

/**
 * 2. חילוץ רשימת מוצרים מתמונה (למשל, רשימת קניות בכתב יד).
 * * @param {string} path - נתיב לקובץ תמונה (jpeg/png).
 * @returns {Promise<string[]>} - מערך של שמות מוצרים נקיים.
 */
export async function extractProductsFromImage(path, mimeType = 'image/jpeg') {
    const imagePart = fileToGenerativePart(path, mimeType);
    const systemPrompt = "You are a shopping list data extractor. Analyze the image, extract all product names from the handwritten or typed list, and return them as a clean JSON list.";

    const rawTextResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [imagePart, systemPrompt],
        config: {
            responseMimeType: "application/json",
            responseSchema: SHOPPING_LIST_SCHEMA,
        },
    });
    
    try {
        const jsonResponse = JSON.parse(rawTextResponse.text.trim());
        return jsonResponse.products || [];
    } catch (e) {
        throw new Error("Failed to extract products from image.");
    }
}

/**
 * 3. חילוץ רשימת מוצרים מטקסט חופשי (ממשק קלט או העתק/הדבק).
 * * @param {string} text - הטקסט הגולמי.
 * @returns {Promise<string[]>} - מערך של שמות מוצרים נקיים.
 */
export async function extractProductsFromText(text) {
    return extractProducts(text);
}

// ניתן להוסיף פונקציה ל-analyzeAudio, אך עליך לוודא שאת משתמשת במודל שתומך בזה
// ומגדירה פרומפט מתאים (למשל, transcribe the audio and then extract the products).