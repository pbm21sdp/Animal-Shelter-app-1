FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy backend source code
COPY src/ ./src/
COPY db/ ./db/
COPY scripts/ ./scripts/

# Expose port
EXPOSE 5000

CMD ["node", "src/app.js"]
