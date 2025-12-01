# 🐳 Optimized Multi-Stage Dockerfile for Fragments Microservice
# Step 1 — Build dependencies
FROM node:22.12.0 AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Step 2 — Production image
FROM node:22.12.0-slim
WORKDIR /app

COPY --from=build /app /app

# Environment variables
ENV NODE_ENV=production \
    PORT=80 \
    LOG_LEVEL=debug \
    HTPASSWD_FILE=.htpasswd

# Expose production port
EXPOSE 80

# Start server
CMD ["npm", "start"]