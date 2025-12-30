FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy environment file (if exists)
COPY .env.docker ./ 2>/dev/null || true

# Copy backend source code
COPY src/ ./src/
COPY db/ ./db/
COPY scripts/ ./scripts/

# Expose port
EXPOSE 5000

CMD ["node", "src/app.js"]
