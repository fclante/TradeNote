# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --omit=dev && rm -rf /root/.npm

# Stage 2: Production
FROM node:22-alpine
RUN apk add --no-cache bash
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/index.mjs ./
COPY --from=build /app/requiredClasses.json ./
COPY --from=build /app/src/utils ./src/utils
COPY --from=build /app/src/stores ./src/stores
CMD ["node", "index.mjs"]