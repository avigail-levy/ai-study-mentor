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
# FROM node:20-alpine

# # התקנת כלים בסיסיים הנדרשים לבניית ספריות מסוימות
# RUN apk add --no-cache python3 make g++

# WORKDIR /app

# # העתקת קבצי התלות בלבד בשלב הראשון (לניצול Cache)
# COPY package*.json ./

# # התקנת כל התלויות
# RUN npm install

# # העתקת שאר קוד המקור
# COPY . .

# # הענקת הרשאות מלאות לתיקייה
# # הסרנו את המעבר ל-appuser כרגע כדי למנוע בעיות Permission Denied מול ה-Volume
# RUN chmod -R 777 /app

# EXPOSE 5000

# # פקודת ההרצה שתואמת את ה-package.json שלך
# CMD ["npm", "start"]
FROM node:20-alpine

WORKDIR /app

# העתקת קבצי package
COPY package.json package-lock.json* ./

# התקנה
RUN npm install

# העתקת כל תוכן תיקיית ה-backend
COPY . .

# בדיקה ויזואלית בתוך הלוג של ג'נקינס שהקבצים קיימים
RUN ls -la

EXPOSE 5000

CMD ["npm", "start"]