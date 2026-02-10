FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json .eslintrc.cjs .prettierrc ./
COPY src ./src
RUN npm run build
RUN mkdir -p /data
CMD ["node", "dist/index.js"]
