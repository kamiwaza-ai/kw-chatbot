FROM node:20-alpine

# Install Python, build dependencies, and PostgreSQL client
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc6-compat \
    postgresql-client

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# First copy only package file
COPY package.json ./

# Install dependencies
RUN pnpm install

# Then copy the rest
COPY . .

# Set build-time environment variable
ENV KAMIWAZA_URI=https://prod.kamiwaza.ai/api

RUN pnpm next build

EXPOSE 3000

COPY ./scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

CMD ["./start.sh"]