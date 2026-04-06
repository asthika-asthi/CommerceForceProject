# Build stage
FROM node:22-slim AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:22-slim

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built frontend and server code
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/package.json ./package.json

# Install tsx for running the server
RUN npm install -g tsx

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["tsx", "server.ts"]