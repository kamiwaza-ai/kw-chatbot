# Kamiwaza Chatbot

A modern, enterprise-ready chatbot powered by Kamiwaza AI.

## Prerequisites

- A Kamiwaza account
- At least one model deployed through your [Kamiwaza Portal](https://portal.kamiwaza.ai)
  - Any additional models you deploy will automatically be connected to the chatbot

## Getting Started with Docker

1. Copy the environment variables:
```bash
cp .env.example .env.docker
```

2. Update the environment variables in `.env.docker` with your Kamiwaza credentials

3. Build and start the Docker containers:
```bash
docker compose up --build
```

Your chatbot will be running at [localhost:3000](http://localhost:3000/). Log in using your Kamiwaza credentials to start chatting.

## Running without Docker

### Prerequisites
- Node.js 20 or later
- PostgreSQL 15 or later
- pnpm (install with `npm install -g pnpm`)

### Setup Steps

1. Install and configure PostgreSQL:
   - Create a database named `chatbot`
   - Create a user `myuser` with password `mypassword`
   - Grant all privileges on the `chatbot` database to `myuser`

   ```sql
   CREATE DATABASE chatbot;
   CREATE USER myuser WITH PASSWORD 'mypassword';
   GRANT ALL PRIVILEGES ON DATABASE chatbot TO myuser;
   ```

2. Copy the environment variables:
```bash
cp .env.example .env
```

3. Update the environment variables in `.env` with your credentials:
   - Set your Kamiwaza credentials
   - Verify the `POSTGRES_URL` matches your database setup

4. Install dependencies:
```bash
pnpm install
```

5. Run database migrations:
```bash
pnpm db:migrate
```

6. Start the development server:
```bash
pnpm dev
```

Your chatbot will be running at [localhost:3000](http://localhost:3000/).

## Roadmap

- [ ] File upload support
- [ ] Multimodality support
- [ ] Document creation
- [ ] In-browser Python code execution
