const API_URL = 'http://localhost:5000';

export async function uploadPDF(file) {
  const formData = new FormData();
  formData.append('pdf', file);
  const res = await fetch(`${API_URL}/upload-pdf`, { method: 'POST', body: formData });
  return res.json();
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_URL}/upload-image`, { method: 'POST', body: formData });
  return res.json();
}

export async function uploadAudio(file) {
  const formData = new FormData();
  formData.append('audio', file);
  const res = await fetch(`${API_URL}/upload-audio`, { method: 'POST', body: formData });
  return res.json();
}

export async function getQuestions(text) {
  const res = await fetch(`${API_URL}/generate-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function explain(text) {
  const res = await fetch(`${API_URL}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}
