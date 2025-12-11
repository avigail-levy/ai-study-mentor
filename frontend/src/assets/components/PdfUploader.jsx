import { useState } from 'react';
import { uploadPDF } from '../services/api';

export default function PdfUploader() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    const res = await uploadPDF(file);
    setResult(res.result);
  };

  return (
    <div>
      <h2>Upload PDF</h2>
      <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Analyze PDF</button>
      <pre>{result}</pre>
    </div>
  );
}
