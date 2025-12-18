import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

function Login({ onLoginSuccess, isDbReady, handleInitialize }) {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleLogin = async () => {
        if (!username) {
            alert('אנא הזן שם משתמש.');
            return;
        }
        setIsLoading(true);
        setMessage('מתחבר/נרשם...');
        try {
            const response = await axios.post(`${BACKEND_URL}/api/auth/login`, { username });
            if (response.data.success) {
                onLoginSuccess(response.data);
            }
        } catch (error) {
            setMessage('שגיאת התחברות. נסה שוב.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="login-container">
            <h2>👋 התחברות למערכת</h2>
            <p>הכנס שם משתמש כדי להתחבר או להירשם.</p>
            <input
                type="text"
                placeholder="הזן שם משתמש"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
            />
            <button onClick={handleLogin} disabled={isLoading || username.length < 3}>
                {isLoading ? 'מתחבר...' : 'כניסה/הרשמה'}
            </button>
            <p className="login-message">{message}</p>
            
            <hr/>
            <h3>🛠️ אתחול מערכת</h3>
            <p>סטטוס DB: {isDbReady ? '✔️ מוכן' : '❌ דורש קידוד וקטורי'}</p>
            {!isDbReady && (
                <button onClick={handleInitialize} disabled={isLoading}>
                    🛠️ התחל קידוד וקטורי (פעם ראשונה)
                </button>
            )}
        </div>
    );
}

export default Login;