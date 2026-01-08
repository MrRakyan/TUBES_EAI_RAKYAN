# Movie Microservices Monorepo

Three Node.js microservices (movie-service, booking-service, user-service) using Apollo Server v4, Prisma and MySQL.

Quick start:

1. For each service run:

```bash
cd movie-service
npm install
npx prisma generate
npx prisma db push
# npx prisma migrate dev --name init   # optional

cd ../booking-service
npm install
npx prisma generate

cd ../user-service
npm install
npx prisma generate
```

2. Start with Docker Compose (builds images and runs services + DBs):

```bash
docker compose up --build
```

Services are exposed on host ports:
- Movie: 5001 -> container 4000
- Booking: 5002 -> container 4000
- User: 5003 -> container 4000

Note: Passwords are stored plain-text in DB for this exercise — do not use in production.
