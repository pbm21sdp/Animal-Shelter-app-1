FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy environment file
COPY .env.docker ./

# Copy backend code
COPY backend/ ./backend/

WORKDIR /app/backend

CMD ["node", "src/app.js"]