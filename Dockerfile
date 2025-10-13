# 🐳 Dockerfile for Fragments Microservice
# This Dockerfile builds a Docker image for the fragments Node.js server

# 1️⃣ Base image with Node.js (use same version as your local machine)
FROM node:22.12.0

# 2️⃣ Metadata about the image
LABEL maintainer="Stephanie Collins <stephcollins@senecapolytechnic.ca>"
LABEL description="Fragments Node.js Microservice for Cloud Programming Lab 5"

# 3️⃣ Environment variables
ENV PORT=8080
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# 4️⃣ Set working directory inside the container
WORKDIR /app

# 5️⃣ Copy dependency files first (for caching efficiency)
COPY package*.json ./

# 6️⃣ Install dependencies
RUN npm install

# 7️⃣ Copy source code
COPY ./src ./src

# 8️⃣ Copy .htpasswd file if using Basic Auth (optional)
COPY ./tests/.htpasswd ./tests/.htpasswd

# 9️⃣ Expose port 8080 (the app’s listening port)
EXPOSE 8080

# 🔟 Start the app
CMD ["npm", "start"]