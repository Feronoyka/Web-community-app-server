FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# RUN ls -la /app/dist/ || echo

FROM node:24-alpine AS production
WORKDIR /app 
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
# RUN ls -la /app/dist/ || echo
RUN mkdir -p uploads
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
