export default {
  testEnvironment: 'node',
  transform: {}, // נדרש עבור תמיכה ב-ES Modules
  
  // הפעלת איסוף כיסוי קוד
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html'], // דוח טקסט בטרמינל ודוח HTML ויזואלי
  
  // אילו קבצים לבדוק?
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'utils/**/*.js'
  ],

  // הגדרת הרף: אם הכיסוי נמוך מ-50%, הבדיקה תיכשל
  coverageThreshold: {
    global: {
      lines: 50,
      functions: 50
    }
  }
};