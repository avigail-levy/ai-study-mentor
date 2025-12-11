import { ai } from './utils/geminiClient.js';
import fs from 'fs';

// Helper - file to Gemini Part
export function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString('base64'),
      mimeType
    }
  };
}

// PDF Analysis
export async function analyzePDF(path) {
  const pdfPart = fileToGenerativePart(path, 'application/pdf');
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [pdfPart, "Summarize and extract key points"],
  });
  return response.text;
}

// Image Analysis
export async function analyzeImage(path) {
  const imagePart = fileToGenerativePart(path, 'image/jpeg');
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [imagePart, "Describe this image in detail"],
  });
  return response.text;
}

// Audio Analysis
export async function analyzeAudio(path) {
  const audioPart = fileToGenerativePart(path, 'audio/mpeg');
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [audioPart, "Summarize audio and key points"],
  });
  return response.text;
}

// Generate Questions
export async function generateQuestions(text) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate 5 multiple-choice questions from this content: ${text}`,
  });
  return response.text;
}

// Explain Concept
export async function explainConcept(text) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Explain this concept simply: ${text}`,
  });
  return response.text;
}
