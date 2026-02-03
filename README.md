# Cloud Fragments Microservice

A cloud-based backend microservice for storing, managing, and converting small text and image fragments through a secure REST API.
This service allows authenticated users to create, retrieve, update, delete, and convert fragments such as plain text, Markdown, JSON, and images. It demonstrates cloud-native backend development, authentication, and scalable data storage.

---

## Features
- REST API for managing text and image fragments
- Supports multiple content types (plain text, Markdown, JSON, images)
- Automatic format conversion (e.g. Markdown → HTML, image formats)
- Secure authentication using Basic Auth and JWT
- User data isolation
- Fragment data stored in AWS S3
- Fragment metadata stored in AWS DynamoDB
- Dockerized local development environment using LocalStack and DynamoDB Local
- Automated unit and integration testing with CI pipelines

---

## Architecture
- **Backend:** Node.js / Express
- **Storage:**
  - AWS S3 for fragment data
  - AWS DynamoDB for fragment metadata
- **Authentication:**
  - HTTP Basic Authentication for local development and testing
  - Bearer token authentication using AWS Cognito with JWT verification
- **Containerization:** Docker & Docker Compose
- **CI/CD:** GitHub Actions

---

## Project Context
This project was developed as part of a Web Programming for Cloud course and focuses on backend API design, cloud integration, and containerized development.
Cloud resources (S3, DynamoDB, ECS) were used via AWS Academy for development and testing. This repository is shared for learning, reference, and portfolio purposes.

A separate frontend UI was implemented during the course to consume this API, however, this repository focuses specifically on the backend service.

---

## Status
Actively maintained. Core functionality is complete, with ongoing refinements and improvements.

---

## Local Development

This section describes how the service was run locally during development and testing.

### Prerequisites
- Node.js ≥ 20
- npm
- Docker & Docker Compose (for local AWS simulation)

---

### Install Dependencies
```bash
npm install

Scripts
Lint
npm run lint
Runs ESLint on ./src/**/*.js. 
Fix all issues until no errors are reported.


Start (normal mode)
npm start
Starts the server normally.
Browser: open http://localhost:8080
Terminal: curl -s http://localhost:8080 | jq


Dev (watch mode + env file)
npm run dev
Uses Node’s built-in --watch and loads environment variables from debug.env.
Example debug.env file:
LOG_LEVEL=debug



Testing
Run unit and integration tests:
npm test


Debug (watch + env + inspector)
npm run debug
Same as dev, but also starts the Node inspector on port 9229, so you can attach VS Code’s debugger.
