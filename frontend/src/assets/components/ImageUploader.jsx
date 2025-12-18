// ImageUploader.jsx - קוד מעודכן
import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

/**
 * @param {function} onFileUploadedAndSaved - פונקציה שקוראת ל-api/calculate-path אחרי ההעלאה
 * @param {number} userId - מזהה המשתמש
 */
function ImageUploader({ userId, onFileUploadedAndSaved, isLoading, setIsLoading, setMessage }) {
    const [fileInput, setFileInput] = useState(null);

    const handleFileChange = (e) => {
        setFileInput(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!fileInput || !userId) return;

        setIsLoading(true);
        setMessage('מעלה תמונה ומנתח אותה באמצעות AI...');
        
        const formData = new FormData();
        formData.append('image', fileInput);
        formData.append('userId', userId); // הוספת userId ל-FormData

        try {
            // קורא ל-Route ב-server.js שינתח את התמונה ויוסיף פריטים ל-DB
            const response = await axios.post(`${BACKEND_URL}/upload-image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setMessage('✅ התמונה נותחה והפריטים נוספו לרשימה! מחשב מסלול...');
                // קורא לפונקציה הראשית כדי להתחיל את המיפוי והחישוב
                onFileUploadedAndSaved(); 
            } else {
                setMessage('שגיאה בניתוח התמונה.');
            }

        } catch (error) {
            console.error('Error analyzing image:', error);
            setMessage('❌ שגיאה בניתוח התמונה או שמירתה ב-DB.');
        } finally {
            setIsLoading(false);
            setFileInput(null); // איפוס הקובץ
        }
    };

    return (
        <div className="uploader-box file-upload image-uploader"> {/* הוספת class לזיהוי */}
            <h4>🖼️ ניתוח תמונה</h4>
            <input 
                type="file" 
                onChange={handleFileChange} 
                accept="image/*"
                disabled={isLoading}
            />
             {fileInput && <p className="file-name">קובץ: {fileInput.name}</p>}
            <button 
                onClick={handleUpload} 
                disabled={isLoading || !fileInput}
            >
                {isLoading ? 'מעלה ומנתח...' : 'בחר תמונה ונתח'}
            </button>
        </div>
    );
}

export default ImageUploader;