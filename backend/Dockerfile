# Use Node.js 20 base image
FROM node:20-alpine

# Hugging Face Spaces runs as user 1000, which is the default 'node' user in alpine
# but we need to make sure the app directory is owned by it.
WORKDIR /app

# Set permissions for the working directory
RUN chown -R node:node /app

# Switch to the existing node user
USER node

# Copy package files
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma/

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY --chown=node:node . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript application
RUN npm run build

# Hugging Face Spaces expects the app to listen on port 7860
ENV PORT=7860
ENV NODE_ENV=production
EXPOSE 7860

# Start the application using the production script
CMD ["npm", "start"]
