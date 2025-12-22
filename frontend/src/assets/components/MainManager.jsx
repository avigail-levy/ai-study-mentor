import React, { useState, useEffect } from 'react';
import Login from './Login';
import ShoppingActions from './shoppingActions';

const MainManager = () => {
    const [user, setUser] = useState(null);
    const [pathResult, setPathResult] = useState({ list: [], aiSummary: '' });

    useEffect(() => {
        const savedId = localStorage.getItem('userId');
        const savedName = localStorage.getItem('userName');
        if (savedId) setUser({ id: savedId, name: savedName });
    }, []);

    const handleLogin = (id, name) => {
        localStorage.setItem('userId', id);
        localStorage.setItem('userName', name);
        setUser({ id, name });
    };

    const handlePathResult = (list, answer) => {
        setPathResult({ list, aiSummary: answer });
    };

    if (!user) return <Login onLoginSuccess={handleLogin} />;

    return (
        <div className="manager-layout">
            <header>
                <h1>SmartPath | שלום {user.name}</h1>
            </header>

            <ShoppingActions userId={user.id} onPathCalculated={handlePathResult} />

            {pathResult.list.length > 0 && (
                <div className="results-container">
                    <h2>המסלול שלך:</h2>
                    <p className="ai-box">{pathResult.aiSummary}</p>
                    <ul className="path-list">
                        {pathResult.list.map((item, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '8px' }}>
    <span style={{ fontSize: '1.5rem' }}>{item.direction}</span> 
    <span>{i+1}. {item.item_name}</span>
</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MainManager;