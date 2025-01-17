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

1. Copy the environment variables:
```bash
cp .env.example .env
```

2. Update the environment variables in `.env` with your credentials

3. Install dependencies and start the server:
```bash
pnpm install
pnpm dev
```

Your chatbot will be running at [localhost:3000](http://localhost:3000/).

## Roadmap

- [ ] File upload support
- [ ] Multimodality support
- [ ] Document creation
- [ ] In-browser Python code execution
