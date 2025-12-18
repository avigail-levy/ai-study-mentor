// ShoppingListManager.jsx - קוד מעודכן
import { useState } from 'react';
import axios from 'axios';
import TextUploader from './TextUploader';
import ImageUploader from './ImageUploader';
import AudioUploader from './AudioUploader';
// ... (שאר הייבוא)

const BACKEND_URL = 'http://localhost:5000';

// ... (SectionHeader ו-ActionCard נשארים זהים)

function ShoppingListManager({ userId, username, isDbReady, setIsLoading, isLoading, setMessage }) {
    // הרשימה הסופית תכיל כעת אובייקטים מסודרים מה-DB, לא רק מחרוזת
    const [sortedList, setSortedList] = useState(null); 
    const [results, setResults] = useState(null);

    // *** פונקציה מרכזית: מתחילה את תהליך המיפוי והחישוב ***
    const handleCalculatePath = async () => {
        if (!isDbReady) {
            setMessage('יש להשלים את אתחול ה-VectorDB!');
            return;
        }

        setIsLoading(true);
        setResults(null);
        setSortedList(null);
        setMessage('🎯 מתחיל מיפוי וקטורי של פריטים וחישוב מסלול במטריצה...');

        try {
            // קורא ל-Route החדש: הוא עושה את כל הלוגיקה (מיפוי, BFS, עדכון DB)
            const pathResponse = await axios.post(`${BACKEND_URL}/api/calculate-path`, {
                userId: userId,
            });

            if (pathResponse.data.success) {
                // רשימת המוצרים מגיעה כבר ממופה ומסודרת
                setSortedList(pathResponse.data.list); 
                // התשובה של AI על המסלול הסופי
                setResults({
                    answer: pathResponse.data.answer,
                    optimalPath: pathResponse.data.list.map(item => item.item_name), // לשמירה על תצוגת המסלול
                    totalTime: 'N/A' // או שנוסיף שדה זה ל-backend/server.js
                }); 
                setMessage('✅ המסלול האופטימלי נמצא בהצלחה!');
            } else {
                setMessage(pathResponse.data.answer || 'לא נמצאו פריטים או קטגוריות רלוונטיות.');
            }

        } catch (error) {
            console.error('Error calculating path:', error);
            setMessage(`❌ שגיאה: ${error.message || 'שגיאה כללית בחישוב.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // הפונקציה לחישוב מסלול מטקסט חד פעמי
    const handleTempListProcessing = async () => {
         // לוגיקה: פשוט הוסף את הטקסט לרשימה הגולמית ואז הפעל את החישוב
         const items = tempShoppingList.split(/[\n,;]/).map(item => item.trim()).filter(item => item.length > 0);
         
         if (items.length === 0) {
             setMessage("אנא הזן פריטים.");
             return;
         }

         setIsLoading(true);
         setMessage("מוסיף פריטים זמניים לרשימה...");
         
         try {
             for(const item of items) {
                 await axios.post(`${BACKEND_URL}/api/list/add-item`, { userId, item_name: item });
             }
             setTempShoppingList('');
             await handleCalculatePath(); // מפעיל מיד את החישוב
         } catch (error) {
             setMessage("שגיאה בהוספת פריטים זמניים.");
         } finally {
             setIsLoading(false);
         }
    };


    return (
        <div className="shopping-manager-container">
            {/* ... (Welcome Section נשאר זהה) ... */}
            
            <div className="main-actions">
                <div className="saved-list-section">
                    <SectionHeader icon="📝" title="רשימת קניות שמורה" />
                    
                    {/* TextUploader: מוסר את ה-persistentList שאינה רלוונטית עוד כנתון טקסטואלי */}
                    <TextUploader 
                        userId={userId} 
                        isLoading={isLoading} 
                        setIsLoading={setIsLoading}
                        setMessage={setMessage}
                    />

                    <button 
                        className="start-button persistent-list-button"
                        onClick={handleCalculatePath} // קריאה ל-handleCalculatePath ללא פרמטרים
                        disabled={isLoading || !isDbReady}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner"></span>
                                מעבד את הבקשה...
                            </>
                        ) : (
                            '🛒 התחל קניה עם הרשימה השמורה'
                        )}
                    </button>
                </div>

                <div className="temp-list-section">
                    <SectionHeader icon="⚡" title="חישוב מסלול מהיר" />
                    {/* ... (Textarea ו-Action Buttons לטקסט חד-פעמי) ... */}
                     <button 
                        className="start-button temp-list-button"
                        onClick={handleTempListProcessing} // קורא לפונקציה המטפלת בהוספה וחישוב
                        disabled={isLoading || !isDbReady || !tempShoppingList}
                    >
                        🗺️ מצא מסלול אופטימלי (חד-פעמי)
                    </button>
                </div>
            </div>
            
            <div className="file-upload-section">
                {/* ... (Section Header) ... */}
                <div className="uploaders-group">
                     {/* עדכון הקריאה ל-ActionCard כדי לפתוח את הקלט הקבצים */}
                     {/* Image Uploader */}
                    <ImageUploader 
                        userId={userId}
                        onFileUploadedAndSaved={handleCalculatePath} 
                        isLoading={isLoading} 
                        setIsLoading={setIsLoading}
                        setMessage={setMessage}
                    />
                    
                     {/* Audio Uploader */}
                    <AudioUploader 
                        userId={userId}
                        onFileUploadedAndSaved={handleCalculatePath} 
                        isLoading={isLoading} 
                        setIsLoading={setIsLoading}
                        setMessage={setMessage}
                    />
                    
                    {/* Pdf Uploader - נניח שהפונקציונליות שלו דומה */}
                    <PdfUploader 
                        userId={userId}
                        onFileUploadedAndSaved={handleCalculatePath} 
                        isLoading={isLoading} 
                        setIsLoading={setIsLoading}
                        setMessage={setMessage}
                    />
                </div>
            </div>

            {/* Results Section - יש להציג כעת את ה-sortedList */}
            {results && sortedList && (
                <div className="results-section">
                    <SectionHeader icon="✨" title="תוצאות החיפוש" />
                    
                    <div className="results-box">
                        <div className="result-header">
                            <h3>רשימת קניות מסודרת לפי מסלול</h3>
                            {/* נשתמש ב-results.totalTime אם נחליט להחזיר אותו מה-Backend */}
                        </div>
                        
                        {/* ... (AI Answer נשאר זהה, משתמש ב-results.answer) ... */}
                        
                        <div className="path-container">
                            <h4>סדר הקניות:</h4>
                            <ol className="path-list">
                                {sortedList.map((item, index) => (
                                    <li key={index}>
                                        <span className="step-number">{item.calculated_order}</span>
                                        <span className="step-text">{item.item_name}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        
                        {/* ... (Result Actions נשאר זהה) ... */}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ShoppingListManager;