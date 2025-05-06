FROM node:22

WORKDIR /app

# Set environment variable to non-interactive that prevents prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Use nodemon for development mode
CMD ["npm", "run", "dev"]