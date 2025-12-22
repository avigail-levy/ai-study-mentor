// const API_URL = 'http://localhost:5000';

// export async function uploadPDF(file) {
//   const formData = new FormData();
//   formData.append('pdf', file);
//   const res = await fetch(`${API_URL}/upload-pdf`, { method: 'POST', body: formData });
//   return res.json();
// }

// export async function uploadImage(file) {
//   const formData = new FormData();
//   formData.append('image', file);
//   const res = await fetch(`${API_URL}/upload-image`, { method: 'POST', body: formData });
//   return res.json();
// }

// export async function uploadAudio(file) {
//   const formData = new FormData();
//   formData.append('audio', file);
//   const res = await fetch(`${API_URL}/upload-audio`, { method: 'POST', body: formData });
//   return res.json();
// }

// export async function getQuestions(text) {
//   const res = await fetch(`${API_URL}/generate-questions`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ text }),
//   });
//   return res.json();
// }

// export async function explain(text) {
//   const res = await fetch(`${API_URL}/explain`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ text }),
//   });
//   return res.json();
// }
// src/api.js
const API_URL = 'http://localhost:5000/api';

export const loginUser = async (email, name) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
    });
    return response.json();
};

export const addItemManual = async (userId, itemName) => {
    const response = await fetch(`${API_URL}/list/add-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, item_name: itemName }),
    });
    return response.json();
};

export const uploadFileAndCalculate = async (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch(`${API_URL}/upload-and-calculate`, {
        method: 'POST',
        body: formData, // FormData לא מצריך Headers של Content-Type
    });
    return response.json();
};

export const calculatePath = async (userId) => {
    console.log("calculatePath",calculatePath);
    const response = await fetch(`${API_URL}/calculate-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    });
    return response.json();
};
export const addVoiceItemsAI = async (userId, transcript) => {
    const response = await fetch(`${API_URL}/list/add-voice-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, transcript }),
    });
    return response.json();
};