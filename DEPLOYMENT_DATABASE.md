# Serverless Database Configuration

## For PostgreSQL (Recommended for Vercel/Netlify)

Update your `prisma/schema.prisma` datasource to:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Environment Variables for Deployment

### Vercel

Set these in your Vercel dashboard:

```
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
```

### Netlify

Set these in your Netlify dashboard:

```
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=https://your-app.netlify.app
```

## Free Database Options

1. **Supabase** (Recommended)

   - Free tier with PostgreSQL
   - Easy integration with Prisma
   - Sign up at https://supabase.com

2. **PlanetScale**

   - Free tier with MySQL
   - Serverless database platform
   - Sign up at https://planetscale.com

3. **Railway**
   - Free tier with PostgreSQL
   - Simple setup
   - Sign up at https://railway.app

## Migration Steps

1. Choose a database provider
2. Update DATABASE_URL in your deployment platform
3. Run: `npx prisma db push` to create tables
4. Run: `npx prisma db seed` to populate data (if you have a seed file)
