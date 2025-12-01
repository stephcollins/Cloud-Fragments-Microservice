# 🐳 Optimized Multi-Stage Dockerfile for Fragments Microservice
# Step 1 — Build dependencies
FROM node:22.12.0 AS build
WORKDIR /app

# Copy package files and install only what's needed for production
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the app
COPY . .

# Step 2 — Lightweight production image
FROM node:22.12.0-slim
WORKDIR /app

# Copy from the build stage
COPY --from=build /app /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080 \
    LOG_LEVEL=debug \
    HTPASSWD_FILE=.htpasswd

# Expose the port and start the app
EXPOSE 8080
CMD ["npm", "start"]