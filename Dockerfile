FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY game_cloud_apis.js economy.js event_raid.js event_equipment.js legacy_save_file.js ./
EXPOSE 8080
CMD ["node", "server/product-api.mjs"]
