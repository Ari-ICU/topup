# Use Node.js 20 base image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose the backend port
EXPOSE 4000

# Start the application in development mode
CMD ["npm", "run", "dev"]
