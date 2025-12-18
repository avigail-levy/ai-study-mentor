// TextUploader.jsx - קוד מעודכן
import  { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

function TextUploader({ userId, isLoading, setIsLoading, setMessage }) {
    const [inputItem, setInputItem] = useState('');

    const handleAddItem = async () => {
        if (!inputItem || !userId) return;
        setIsLoading(true);
        setMessage('מוסיף פריט לרשימה גולמית...');
        try {
            // ה-API החדש שלכם (ב-server.js) מקבל item_name ומוסיף שורה חדשה ל-DB
            const response = await axios.post(`${BACKEND_URL}/api/list/add-item`, {
                userId,
                item_name: inputItem.trim() // שינוי שם השדה ל-item_name (כפי שנדרש ב-server.js)
            });
            if (response.data.success) {
                setInputItem('');
                setMessage(`✅ הפריט "${inputItem.trim()}" נוסף לרשימה השמורה ב-DB.`);
            }
        } catch (error) {
            setMessage('❌ שגיאה בהוספת פריט.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="uploader-box">
            <h4>➕ הוספת פריט לרשימה השמורה</h4>
            <div className="add-item-group">
                <input
                    type="text"
                    placeholder="הוסף פריט חדש (לדוגמה: עגבניות)"
                    value={inputItem}
                    onChange={(e) => setInputItem(e.target.value)}
                    disabled={isLoading}
                />
                <button onClick={handleAddItem} disabled={isLoading || !inputItem}>הוסף</button>
            </div>
            <p><strong>סטטוס:</strong> הפריטים נשמרים בבסיס הנתונים.</p>
        </div>
    );
}

export default TextUploader;