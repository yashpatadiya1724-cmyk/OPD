# Multi-Stage Dockerfile for MediQ Web Platform
# Stage 1: Build Application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with clean cache
COPY package*.json ./
RUN npm ci

# Copy source files and compile Vite production bundle
COPY . .
RUN npm test
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
