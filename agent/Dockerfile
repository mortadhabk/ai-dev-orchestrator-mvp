FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json .eslintrc.cjs .prettierrc ./
COPY src ./src
RUN npm run build
CMD ["node", "dist/agent.js"]
