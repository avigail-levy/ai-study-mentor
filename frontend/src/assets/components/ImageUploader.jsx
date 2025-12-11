import { useState } from 'react';
import { uploadImage } from '../services/api';

export default function ImageUploader() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    const res = await uploadImage(file);
    setResult(res.result);
  };

  return (
    <div>
      <h2>Upload Image</h2>
      <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Analyze Image</button>
      <pre>{result}</pre>
    </div>
  );
}
