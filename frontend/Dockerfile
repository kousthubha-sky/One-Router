FROM node:20-alpine

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Don't copy source code - it will be mounted via volume
# COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
