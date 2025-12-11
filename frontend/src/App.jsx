import './App.css'
import PdfUploader from './assets/components/PdfUploader';
import ImageUploader from './assets/components/ImageUploader';
import AudioUploader from './assets/components/AudioUploader';
import QuestionsPanel from './assets/components/QuestionsPanel';
import ChatWithAI from './assets/components/ChatWithAI';

function App() {
  return (
    <>
        <div>
          <h1>Gemini AI Multi-Modal Project</h1>
          <PdfUploader />
          <ImageUploader />
          <AudioUploader />
          <QuestionsPanel/>
          <ChatWithAI/>
        </div>    
    </>
  )
}

export default App
