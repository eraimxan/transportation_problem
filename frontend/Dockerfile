FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Для Windows используем другую команду
EXPOSE 3000

# Для Windows - используем прямую команду vite
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3000"]