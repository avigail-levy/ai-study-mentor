import React, { useState } from 'react';
import { loginUser } from '../services/api.js';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await loginUser(email, name);
            if (data.success) {
                onLoginSuccess(data.userId, name);
            }
        } catch (err) {
            alert("שגיאה בתהליך ההתחברות");
        } finally {
            setLoading(false);
        }
    };

  return (
        <div className="login-card">
            <h2>👋 ברוכים הבאים</h2>
            <p>התחברו או הירשמו כדי להתחיל לתכנן את הקניות שלכם</p>
            <form onSubmit={handleAuth}>
                <input type="text" placeholder="שם מלא" required onChange={e => setName(e.target.value)} />
                <input type="email" placeholder="אימייל" required onChange={e => setEmail(e.target.value)} />
                <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? <div className="spinner"></div> : "כניסה למערכת"}
                </button>
            </form>
        </div>
    );
};

export default Login;