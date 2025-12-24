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
            alert("Added to list!");
        } catch (err) {
            alert("Error adding product");
        } finally {
            setIsWorking(false);
        }
    };

    const handleFileUpload = async (e) => {
        console.log("handleFileUpload");
        const file = e.target.files[0];
        if (!file) return;
        setIsWorking(true);
        try {
            await uploadFileAndCalculate(userId, file);
            alert("Products from file added successfully!");
        } catch (err) {
            alert("Error processing file");
        } finally {
            setIsWorking(false);
        }
    };

    const handleVoiceRecord = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support voice recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; // Changed to English for consistency
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            setIsListening(false);
            setIsWorking(true);
            try {
                const data = await addVoiceItemsAI(userId, transcript);
                if (data.success) {
                    alert(`Recognized and added: ${data.items.join(', ')}`);
                }
            } catch (err) {
                alert("Error in AI analysis");
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
            const data = await calculatePath(userId); 
            if (data && data.list) {
                onPathCalculated(data.list, data.answer);
            } else {
                alert("No products found to calculate path");
            }
        } catch (err) {
            console.error(err);
            alert("Error calculating path");
        } finally {
            setIsWorking(false);
        }
    };

    const handleClearList = async () => {
        if (!window.confirm("Are you sure you want to clear the entire list?")) return;
        
        setIsWorking(true);
        try {
            const response = await fetch('http://localhost:5000/api/list/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            
            const data = await response.json();
            if (data.success) {
                alert("List cleared successfully!");
                if (onPathCalculated) onPathCalculated([], '');
            }
        } catch (err) {
            console.error(err);
            alert("Error clearing the list");
        } finally {
            setIsWorking(false);
        }
    };

    return (
        <div className="actions-card">
            <div className="input-section">
                <h3>✍️ Quick Add</h3>
                <div style={{display: 'flex', gap: '8px'}}>
                    <input type="text" value={textItem} onChange={e => setTextItem(e.target.value)} placeholder="Milk, Bread..." />
                    <button className="add-btn" onClick={handleManual} disabled={isWorking}>Add</button>
                </div>
            </div>

            <div className="input-section" style={{marginTop: '20px'}}>
                <h3>📄 Upload List (PDF/Image)</h3>
                <input type="file" className="file-input" onChange={handleFileUpload} accept="image/*,application/pdf" disabled={isWorking} />
            </div>

            <div className="input-section" style={{marginTop: '20px'}}>
                <h3>🎤 Voice Record</h3>
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
                    {isListening ? "👂 Listening..." : "🎤 Record Items"}
                </button>
            </div>

            <hr style={{margin: '25px 0', opacity: '0.2'}} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="calculate-btn" onClick={handleStartShopping} disabled={isWorking || isListening}>
                    {isWorking ? "Processing..." : "🚀 Calculate Shortest Path"}
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
                    🗑️ Clear List
                </button>
            </div>
        </div>
    );
};

export default ShoppingActions;