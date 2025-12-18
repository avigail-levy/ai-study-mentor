import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// רכיבים קיימים (שליחת קבצים וצ'אט)
// הערה: נשאיר את אלו כי הם משמשים גם ב-"כלי לימוד וצ'אט"
import PdfUploader from './assets/components/PdfUploader'; 
import ImageUploader from './assets/components/ImageUploader';
import AudioUploader from './assets/components/AudioUploader';

// רכיבים חדשים (מערכת הקניות החכמה)
import Login from './assets/components/Login';
import ShoppingListManager from './assets/components/ShoppingListManager';

// כתובת ה-Backend, כפי שהגדרנו ב-docker-compose
const BACKEND_URL = 'http://localhost:5000';

function App() {
    // 1. סטייטים לניהול משתמש וסטטוס DB
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState('');
    // *** הוסרה: initialList - רשימת הקניות ההתחלתית כבר אינה רלוונטית כטקסט גלובלי ***
    const [isDbReady, setIsDbReady] = useState(false);
    
    // 2. סטייטים גלובליים לטעינה והודעות
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('ממתין להתחברות...');

    // **********************************
    // *** A. ניהול סטטוס DB ואתחול ***
    // **********************************

    // בדיקת סטטוס ה-DB (האם ה-Embeddings נוצרו?)
    const checkDbStatus = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/check-status`);
            if (response.data.ready) {
                setIsDbReady(true);
                setMessage('✔️ מסד הנתונים מוכן לחיפוש וקטורי!');
            } else {
                setIsDbReady(false);
                setMessage(`⚠️ יש לקודד את הקטגוריות לפני השימוש במערכת הקניות. ${response.data.embeddedCategories}/${response.data.totalCategories}`);
            }
        } catch (error) {
            console.error('Error checking DB status:', error);
            setMessage('❌ שגיאת חיבור ל-Backend או DB. אנא ודא שה-Docker פועל.');
        }
    };
    
    // אתחול ה-Embeddings
    const handleInitialize = async () => {
        setIsLoading(true);
        setMessage('מתחיל קידוד וקטורי. הפעולה עשויה לקחת דקה...');
        try {
            const response = await axios.post(`${BACKEND_URL}/api/initialize-embeddings`);
            if (response.data.success) {
                setMessage(response.data.message || `בוצע קידוד בהצלחה.`);
                await checkDbStatus(); 
            } else {
                setMessage('שגיאה באתחול הקידוד.');
            }
        } catch (error) {
            setMessage('שגיאה בביצוע האתחול.');
        } finally {
            setIsLoading(false);
        }
    };

    // בדיקה אוטומטית בעת טעינת הקומפוננטה
    useEffect(() => {
        checkDbStatus();
        const interval = setInterval(checkDbStatus, 5000); 
        return () => clearInterval(interval);
    }, []);

    // **********************************
    // *** B. פונקציית Login Callback ***
    // **********************************
    
    const handleLoginSuccess = (data) => {
        setUserId(data.userId);
        setUsername(data.username);
        // *** הסרנו את setInitialList, כיוון שהרשימה מנוהלת כעת ב-DB ***
        setMessage(`ברוך הבא, ${data.username}.`);
    };

    // **********************************
    // *** C. רינדור אפליקציה ***
    // **********************************

    return (
        <div className="app-container">
            <header>
                <h1>🛒 פרויקט Gemini AI רב-מודאלי</h1>
                <p className={`global-message ${isDbReady ? 'ready' : 'not-ready'}`}>{message}</p>
            </header>

            {/* אם המשתמש לא מחובר, מציגים את קומפוננטת ה-Login */}
            {!userId ? (
                <Login 
                    onLoginSuccess={handleLoginSuccess}
                    isDbReady={isDbReady}
                    handleInitialize={handleInitialize}
                />
            ) : (
                // אם המשתמש מחובר, מציגים את מערכת ניהול הקניות
                <ShoppingListManager
                    userId={userId}
                    username={username}
                    // *** initialList הוסר ***
                    isDbReady={isDbReady}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    setMessage={setMessage}
                />
            )}
            
            <hr/>
            
            {/* רכיבי המולטימדיה הכלליים (נשמרו לצרכי "כלי לימוד וצ'אט") */}
            <div className="general-tools-panel">
                <h2>כלי לימוד וצ'אט (מולטימודליות)</h2>
                {/* הערה: אם רכיבי ה-Uploader בתוך general-tools-panel לא עודכנו לעבוד 
                     ללא ה-userId שנדרש ע"י ShoppingListManager, 
                     יש להשאיר אותם עם הprops הפשוטים שאינם קשורים לרשימה.
                     הנחה: רכיבים אלה משמשים לשימוש כללי (כגון שאלות על PDF) 
                     ולא לניהול רשימת קניות.
                */}
                <div className="uploader-group">
                    <PdfUploader />
                    <ImageUploader />
                    <AudioUploader />
                </div>
            </div>
        </div>
    );
}

export default App;