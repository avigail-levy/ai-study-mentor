import React, { useState } from 'react';
import { addItemManual, uploadFileAndCalculate, calculatePath,addVoiceItemsAI} from '../services/api.js';

const ShoppingActions = ({ userId, onPathCalculated }) => {
    const [textItem, setTextItem] = useState('');
    const [isWorking, setIsWorking] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // 1. הוספה ידנית
    const handleManual = async () => {
        if (!textItem) return;
        await addItemManual(userId, textItem);
        setTextItem('');
        alert("נוסף לרשימה!");
    };

    // 2. העלאת קבצים (תמונה / PDF)
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

    // 3. הקלטה קולית - הפיכת דיבור לטקסט ושליחה ל-API
    const handleVoiceRecord = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert("הדפדפן שלך לא תומך בזיהוי קולי.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'he-IL'; // הגדרה לעברית
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    setIsListening(false);
    setIsWorking(true);
    
    try {
        // שימוש בפונקציה החדשה שקוראת לגמיני לפרק את הטקסט
        const data = await addVoiceItemsAI(userId, transcript);
        if (data.success) {
            alert(`גמיני זיהה והוסיף: ${data.items.join(', ')}`);
        }
    } catch (err) {
        alert("שגיאה בניתוח ההקלטה על ידי ה-AI");
    } finally {
        setIsWorking(false);
    }
};

        recognition.onerror = () => {
            setIsListening(false);
            alert("הייתה בעיה בזיהוי הקולי. נסה שוב.");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    // 4. כפתור הקסם - צא לקניות
    const handleStartShopping = async () => {
        console.log("handleStartShopping",handleStartShopping);
        setIsWorking(true);
        try {
            const data = await calculatePath(userId);
            onPathCalculated(data.list, data.answer);
        } catch (err) {
            alert("שגיאה בחישוב המסלול");
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
                    <button className="add-btn" onClick={handleManual}>הוסף</button>
                </div>
            </div>

            <div className="input-section" style={{marginTop: '20px'}}>
                <h3>📄 העלאת רשימה (PDF/תמונה)</h3>
                <input type="file" className="file-input" onChange={handleFileUpload} accept="image/*,application/pdf" />
            </div>

            <div className="input-section" style={{marginTop: '20px'}}>
                <h3>🎤 הקלטת רשימת קניות</h3>
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
                    {isListening ? "👂 מאזין... דבר עכשיו" : "🎤 לחץ והקלט מוצרים"}
                </button>
            </div>

            <hr style={{margin: '25px 0', opacity: '0.2'}} />

            <button className="calculate-btn" onClick={handleStartShopping} disabled={isWorking || isListening}>
                {isWorking ? (
                    <>
                        <div className="spinner"></div>
                        <span>המערכת מעבדת...</span>
                    </>
                ) : "🚀 צא לקניות! (חשב מסלול)"}
            </button>
        </div>
    );
};

export default ShoppingActions;