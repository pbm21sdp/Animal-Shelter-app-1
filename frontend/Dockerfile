FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy frontend code
COPY frontend/ ./frontend/

WORKDIR /app/frontend

CMD ["npm", "start"]