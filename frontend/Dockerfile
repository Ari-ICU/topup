# Use Node.js 20 base image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the frontend port
EXPOSE 3000

# Start Next.js in development mode
CMD ["npm", "run", "dev"]
