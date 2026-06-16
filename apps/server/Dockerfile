FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install

FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/apps/server/package.json apps/server/package.json
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/node_modules node_modules
EXPOSE 5000
CMD ["node", "apps/server/dist/apps/server/src/server.js"]
