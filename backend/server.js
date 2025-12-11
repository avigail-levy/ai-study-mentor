import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { analyzePDF, analyzeImage, analyzeAudio, generateQuestions, explainConcept } from './assistant.js';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Routes
app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  const result = await analyzePDF(req.file.path);
  res.json({ result });
});

app.post('/upload-image', upload.single('image'), async (req, res) => {
  const result = await analyzeImage(req.file.path);
  res.json({ result });
});

app.post('/upload-audio', upload.single('audio'), async (req, res) => {
  const result = await analyzeAudio(req.file.path);
  res.json({ result });
});

app.post('/generate-questions', async (req, res) => {
  const { text } = req.body;
  const result = await generateQuestions(text);
  res.json({ result });
});

app.post('/explain', async (req, res) => {
  const { text } = req.body;
  const result = await explainConcept(text);
  res.json({ result });
});

app.listen(process.env.PORT || 5000, () => {
  console.log('Backend running on port', process.env.PORT || 5000);
});
