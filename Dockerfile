# ─── Build stage ───
FROM node:20-alpine AS builder
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && cp -r node_modules /prod_node_modules
RUN npm ci
COPY . .
RUN npm run build

# ─── Production stage ───
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /prod_node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
