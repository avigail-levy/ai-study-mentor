FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production 
COPY . .
EXPOSE 5000
# שימוש ב-node רגיל ולא nodemon
CMD ["node", "server.js"]