import React, { useState } from 'react';
import axios from 'axios';

// כתובת ה-Backend, כפי שהגדרנו ב-docker-compose (פורט 5000)
const BACKEND_URL = 'http://localhost:5000';

/**
 * קומפוננטה להעלאת קובץ אודיו של רשימת קניות לניתוח.
 * * @param {function} onListExtracted - פונקציית קריאה חוזרת שמקבלת את הטקסט שנותח על ידי ה-AI
 * @param {boolean} isLoading - סטטוס טעינה גלובלי
 * @param {function} setIsLoading - פונקציה לעדכון סטטוס הטעינה הגלובלי
 * @param {function} setMessage - פונקציה לעדכון הודעות המשתמש הראשיות
 */
function AudioUploader({ onListExtracted, isLoading, setIsLoading, setMessage }) {
    const [fileInput, setFileInput] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFileInput(file);
    };

    const handleUpload = async () => {
        if (!fileInput) return;

        setIsLoading(true);
        setMessage('מעלה הקלטה ומנתח אותה באמצעות Gemini AI...');
        
        const formData = new FormData();
        // ודא שהשם 'audio' תואם לשם השדה ב-server.js
        formData.append('audio', fileInput); 

        try {
            // קורא ל-Route ב-server.js שינתח את האודיו
            const response = await axios.post(`${BACKEND_URL}/upload-audio`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const extractedText = response.data.result;
            
            if (extractedText) {
                setMessage(`טקסט חולץ מההקלטה: ${extractedText.substring(0, 40)}...`);
                // שולח את הטקסט החולץ לקומפוננטה הראשית כדי שתחשב מסלול (handleFindPath)
                onListExtracted(extractedText); 
            } else {
                setMessage('AI לא הצליח לחלץ רשימה מההקלטה. נסה לדבר ברור יותר.');
            }

        } catch (error) {
            console.error('Error analyzing audio:', error);
            setMessage('שגיאה בניתוח ההקלטה. אנא ודא שה-Backend פועל.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="uploader-box file-upload">
            <h4>🎙️ ניתוח הקלטת קניות</h4>
            <input 
                type="file" 
                onChange={handleFileChange} 
                accept="audio/*"
                disabled={isLoading}
            />
            {fileInput && <p className="file-name">קובץ: {fileInput.name}</p>}
            
            <button 
                onClick={handleUpload} 
                disabled={isLoading || !fileInput}
            >
                {isLoading ? 'מנתח...' : 'בחר הקלטה ונתח'}
            </button>
        </div>
    );
}

export default AudioUploader;