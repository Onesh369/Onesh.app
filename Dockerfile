FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server

ENV NODE_ENV=production
ENV PORT=80
ENV DATA_DIR=/data
# Set DATABASE_URL in EasyPanel environment variables
# Example: postgres://user:password@postgres:5432/onesh369
# ENV DATABASE_URL=

EXPOSE 80
CMD ["node", "server/index.mjs"]
