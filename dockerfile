FROM node:18-alpine

WORKDIR /frontend-service

COPY package.json package-lock.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]