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

WORKDIR /app

# העתקת קבצי התלות והתקנתם
COPY package*.json ./
# התקנת כל התלויות (כולל devDependencies לטסטים)
RUN npm install

# העתקת קוד המקור
COPY . .

# יצירת משתמש לא-שורשי והעברת בעלות
# Ensure the appuser owns the application directory
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

# חשיפת הפורט
EXPOSE 5000

# הפקודה להרצת השרת
CMD ["npm", "start"]
