FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Pour le développement, on utilise la commande de dev de vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
