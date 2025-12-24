import { useState, useEffect } from 'react';
import Login from './Login';
import ShoppingActions from './shoppingActions';
import ShoppingListPage from './ShoppingListPage.jsx';

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
        <div className="manager-layout" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <header>
                <h1>Smart Shopper | Hello {user.name}</h1>
            </header>

            <ShoppingActions userId={user.id} onPathCalculated={handlePathResult} />
            <ShoppingListPage userId={user.id} />

            {pathResult.list.length > 0 && (
                <div className="results-container" style={{ marginTop: '30px' }}>
                    <h2>The shortest route to your shopping:</h2>

                    {pathResult.aiSummary && (
                        <p className="ai-box" style={{ background: '#f0f7ff', padding: '10px', borderRadius: '8px' }}>
                            {pathResult.aiSummary}
                        </p>
                    )}

                    <ul className="path-list" style={{ listStyle: 'none', padding: 0 }}>
                        {pathResult.list.map((item, i) => (
                            <li
                                key={i}
                                style={{
                                    borderBottom: '2px solid #f0f0f0',
                                    padding: '15px 10px',
                                    marginBottom: '10px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#333' }}>
                                    {i + 1}. {item.item_name}
                                </div>

                                {/* 🔧 FIXED LTR INSTRUCTIONS CONTAINER */}
                                <div
                                    style={{
                                        marginTop: '8px',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start', // ⭐
                                        gap: '8px',
                                        color: '#555',
                                        backgroundColor: '#fafafa',
                                        padding: '8px',
                                        borderRadius: '5px',
                                        direction: 'ltr',             // ⭐
                                        textAlign: 'left'             // ⭐
                                    }}
                                >
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                        Instructions:
                                    </span>

                                    {item.fullPath && item.fullPath.length > 0 ? (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                                gap: '6px',
                                                direction: 'ltr',
                                                whiteSpace: 'nowrap'     // ⭐
                                            }}
                                        >
                                            {item.fullPath.map((step, idx) => (
                                                <span key={idx} style={{ fontSize: '1.3rem' }}>
                                                    {step}
                                                    {idx < item.fullPath.length - 1 && (
                                                        <span style={{ margin: '0 6px', opacity: 0.4 }}>➔</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span>📍 You are already here</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MainManager;
