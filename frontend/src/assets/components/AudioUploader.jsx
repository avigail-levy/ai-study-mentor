import { useState } from 'react';
import { uploadAudio } from '../services/api';

export default function AudioUploader() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    const res = await uploadAudio(file);
    setResult(res.result);
  };

  return (
    <div>
      <h2>Upload Audio</h2>
      <input type="file" accept="audio/*" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Analyze Audio</button>
      <pre>{result}</pre>
    </div>
  );
}
