FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Next.js needs these at build time for static pages
ARG NEXT_PUBLIC_APP_URL=https://www.indiatherapist.com
ARG NEXT_PUBLIC_API_URL=https://api.indiatherapist.com
ARG NEXT_PUBLIC_ADMIN_SECRET=""
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ADMIN_SECRET=$NEXT_PUBLIC_ADMIN_SECRET
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV PORT=3000
EXPOSE $PORT

CMD ["node", "server.js"]
