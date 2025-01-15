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

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm next build

EXPOSE 3000

COPY ./scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

CMD ["./start.sh"]