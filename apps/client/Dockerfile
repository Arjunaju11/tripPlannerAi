FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/client/package.json apps/client/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install

FROM deps AS build
COPY . .
RUN npm run build --workspace @trip-planner/client

FROM nginx:1.27-alpine
COPY --from=build /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
