# Install dependencies only when needed
FROM node:20-alpine as builder


WORKDIR /app

RUN apk add --no-cache bash


COPY package*.json ./
RUN npm ci --quiet

COPY ./prisma prisma
COPY ./src src
RUN npx prisma generate                   


EXPOSE 3000
CMD ["npm", "run", "dev"]

COPY ./docker-entrypoint.sh /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
