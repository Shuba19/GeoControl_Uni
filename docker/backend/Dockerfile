FROM node:lts

WORKDIR /app

COPY ../../package.json ../../package-lock.json ./
RUN npm ci

RUN npm install -g ts-node 

COPY ../../tsconfig.json ./
COPY ../../src ./src
COPY ../../scripts ./scripts
COPY ../../doc ./doc

# Entrypoint: wait for DB, create root user, then start server

CMD ["sh", "-c", "ts-node -r tsconfig-paths/register scripts/create-root-user.ts && ts-node -r tsconfig-paths/register src/index.ts"]