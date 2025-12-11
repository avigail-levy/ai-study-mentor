import { useState } from 'react';
import { getQuestions } from '../services/api';

export default function QuestionsPanel() {
  const [text, setText] = useState('');
  const [questions, setQuestions] = useState([]);

  const handleGenerate = async () => {
    if (!text) return;
    const res = await getQuestions(text);
    setQuestions(res.questions || []);
  };

  return (
    <div>
      <h2>Generate Questions</h2>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={5} cols={50} />
      <button onClick={handleGenerate}>Generate</button>
      <ul>
        {questions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ul>
    </div>
  );
}
