# ---------- Stage 1: build Angular ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies into a cached layer (only re-run when package*.json changes)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Stage 2: serve static files with nginx ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/digital-banking-portal/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
