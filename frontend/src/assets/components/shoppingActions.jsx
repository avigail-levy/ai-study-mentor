import React, { useState } from 'react';
import { addItemManual, uploadFileAndCalculate, calculatePath, addVoiceItemsAI } from '../services/api.js';

const ShoppingActions = ({ userId, onPathCalculated }) => {
    const [textItem, setTextItem] = useState('');
    const [isWorking, setIsWorking] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const handleManual = async () => {
        if (!textItem) return;
        setIsWorking(true);
        try {
            await addItemManual(userId, textItem);
            setTextItem('');
            alert("נוסף לרשימה!");
        } catch (err) {
            alert("שגיאה בהוספת מוצר");
        } finally {
            setIsWorking(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsWorking(true);
        try {
            await uploadFileAndCalculate(userId, file);
            alert("המוצרים מהקובץ נוספו בהצלחה!");
        } catch (err) {
            alert("שגיאה בעיבוד הקובץ");
        } finally {
            setIsWorking(false);
        }
    };

    const handleVoiceRecord = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("הדפדפן שלך לא תומך בזיהוי קולי.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'he-IL';
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            setIsListening(false);
            setIsWorking(true);
            try {
                const data = await addVoiceItemsAI(userId, transcript);
                if (data.success) {
                    alert(`זיהיתי והוספתי: ${data.items.join(', ')}`);
                }
            } catch (err) {
                alert("שגיאה בניתוח ה-AI");
            } finally {
                setIsWorking(false);
            }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const handleStartShopping = async () => {
        setIsWorking(true);
        try {
            // וודא שהשרת מחזיר כאן אובייקט שמכיל list שבו לכל פריט יש fullPath
            const data = await calculatePath(userId); 
            if (data && data.list) {
                onPathCalculated(data.list, data.answer);
            } else {
                alert("לא נמצאו מוצרים לחישוב מסלול");
            }
        } catch (err) {
            console.error(err);
            alert("שגיאה בחישוב המסלול");
        } finally {
            setIsWorking(false);
        }
    };

    const handleClearList = async () => {
        if (!window.confirm("האם אתה בטוח שברצונך למחוק את כל הרשימה?")) return;
        
        setIsWorking(true);
        try {
            // פנייה ישירה לשרת למחיקת הרשימה
            const response = await fetch('http://localhost:5000/api/list/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            
            const data = await response.json();
            if (data.success) {
                alert("הרשימה נמחקה בהצלחה!");
                // איפוס התצוגה במסך הראשי (מעביר רשימה ריקה)
                if (onPathCalculated) onPathCalculated([], '');
            }
        } catch (err) {
            console.error(err);
            alert("שגיאה במחיקת הרשימה");
        } finally {
            setIsWorking(false);
        }
    };

    return (
        <div className="actions-card">
            <div className="input-section">
                <h3>✍️ הוספה מהירה</h3>
                <div style={{display: 'flex', gap: '8px'}}>
                    <input type="text" value={textItem} onChange={e => setTextItem(e.target.value)} placeholder="חלב, לחם..." />
                    <button className="add-btn" onClick={handleManual} disabled={isWorking}>הוסף</button>
                </div>
            </div>

            <div className="input-section" style={{marginTop: '20px'}}>
                <h3>📄 העלאת רשימה (PDF/תמונה)</h3>
                <input type="file" className="file-input" onChange={handleFileUpload} accept="image/*,application/pdf" disabled={isWorking} />
            </div>

            <div className="input-section" style={{marginTop: '20px'}}>
                <h3>🎤 הקלטת רשימה</h3>
                <button 
                    className={`voice-btn ${isListening ? 'listening' : ''}`} 
                    onClick={handleVoiceRecord}
                    disabled={isWorking || isListening}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: isListening ? '#ff4d4d' : '#22a10896',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer'
                    }}
                >
                    {isListening ? "👂 מאזין..." : "🎤 הקלט מוצרים"}
                </button>
            </div>

            <hr style={{margin: '25px 0', opacity: '0.2'}} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="calculate-btn" onClick={handleStartShopping} disabled={isWorking || isListening}>
                    {isWorking ? "המערכת מעבדת..." : "🚀 חשב מסלול קצר ביותר"}
                </button>

                <button 
                    onClick={handleClearList} 
                    disabled={isWorking || isListening}
                    style={{
                        padding: '10px',
                        backgroundColor: '#ff4d4d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    🗑️ נקה רשימה
                </button>
            </div>
        </div>
    );
};

export default ShoppingActions;