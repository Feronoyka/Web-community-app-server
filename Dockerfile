FROM node:24-alpine
WORKDIR /server
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
