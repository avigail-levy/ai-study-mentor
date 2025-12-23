# # שלב 1: בניית התלויות
# FROM node:20-alpine AS dependencies
# WORKDIR /app
# COPY package*.json ./
# # התקנת תלויות Production בלבד
# RUN npm ci --omit=dev

# # שלב 2: יצירת אימג' Production סופי
# FROM node:20-alpine AS final
# WORKDIR /app

# # העתקת התלויות מהשלב הקודם
# COPY --from=dependencies /app/node_modules ./node_modules

# # העתקת קוד המקור
# COPY . .

# # יצירת משתמש לא-שורשי והעברת בעלות
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# USER appuser

# # חשיפת הפורט
# EXPOSE 5000

# # הפקודה להרצת השרת
# CMD ["node", "server.js"]
# שימוש בגרסת Node עדכנית וקלה
FROM node:20-alpine

# התקנת כלים בסיסיים שנדרשים לעיתים לבניית תלויות
RUN apk add --no-cache python3 make g++

WORKDIR /app

# העתקת קבצי התלות
COPY package*.json ./

# התקנת כל התלויות (כולל אלו של הטסטים)
RUN npm install

# העתקת שאר קוד המקור
COPY . .

# יצירת משתמש מאובטח והענקת הרשאות מלאות לתיקיית העבודה
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# חשוב: ביצוע NPM Install נוסף אם יש צורך בשינוי בעלות, 
# או פשוט לוודא שהמשתמש יכול לכתוב לתיקייה
USER appuser

EXPOSE 5000

# שימוש ב-NPM START כברירת מחדל
CMD ["npm", "start"]