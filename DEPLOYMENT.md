# Vercel Deployment Guide - LogAllot Provision Error Log Analysis

## Prerequisites

- [Vercel Account](https://vercel.com)
- [GitHub Account](https://github.com) (for repository hosting)
- PostgreSQL Database (Vercel Postgres, Supabase, PlanetScale, etc.)

## Quick Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/logallot-web)

### Option 2: Manual Deployment

1. **Push to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit - LogAllot Provision Error Log Analysis"
   git branch -M main
   git remote add origin https://github.com/yourusername/logallot-web.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository and click "Deploy"

## Environment Configuration

### Required Environment Variables

Set these in your Vercel Dashboard under Project Settings > Environment Variables:

```bash
# Database (Required)
DATABASE_URL="postgresql://username:password@host:port/database"

# Vercel Edge Config (Required)
EDGE_CONFIG="your-edge-config-connection-string"

# Authentication (Required)
NEXTAUTH_SECRET="your-secure-32-character-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"

# AI Provider API Keys (Optional - can be managed via Edge Config)
GROQ_API_KEY="your-groq-api-key"
OPENAI_API_KEY="your-openai-api-key"
HUGGINGFACE_API_KEY="your-huggingface-api-key"
OPENROUTER_API_KEY="your-openrouter-api-key"
TOGETHER_API_KEY="your-together-api-key"
MISTRAL_API_KEY="your-mistral-api-key"
COHERE_API_KEY="your-cohere-api-key"
ZAI_API_KEY="your-zai-api-key"
```

### Database Setup Options

#### Option 1: Vercel Postgres (Recommended)

1. Install Vercel Postgres:
   ```bash
   npm i @vercel/postgres
   ```
2. Add Vercel Postgres integration in your Vercel dashboard
3. Copy the connection string to `DATABASE_URL`

#### Option 2: Supabase

1. Create project at [Supabase](https://supabase.com)
2. Get connection string from Settings > Database
3. Format: `postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`

#### Option 3: PlanetScale

1. Create database at [PlanetScale](https://planetscale.com)
2. Get connection string from dashboard
3. Format: `mysql://[USERNAME]:[PASSWORD]@[HOST]/[DATABASE_NAME]?sslaccept=strict`

## Edge Config Setup

### Configure AI Providers via Edge Config

1. **Access Vercel Edge Config**

   - Go to your Vercel Dashboard
   - Navigate to Storage > Edge Config
   - Click on your Edge Config instance

2. **Add AI Provider Configuration**

   ```json
   {
     "primaryProvider": "groq",
     "temperature": 0.3,
     "maxTokens": 2000,
     "timeout": 30000,
     "providers": {
       "groq": {
         "apiKey": "your-groq-api-key",
         "model": "llama-3.1-70b-versatile"
       },
       "openai": {
         "apiKey": "your-openai-api-key",
         "model": "gpt-4o-mini"
       },
       "huggingface": {
         "apiKey": "your-huggingface-api-key",
         "model": "microsoft/DialoGPT-medium"
       }
     }
   }
   ```

3. **Enable Feature Flags** (Optional)
   ```json
   {
     "features": {
       "aiAnalysis": true,
       "realTimeUpdates": true,
       "advancedFiltering": true,
       "teamNotifications": true
     }
   }
   ```

## Database Migration

After deployment, run database migrations:

```bash
# Install Prisma CLI
npm install -g prisma

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed database (optional)
npx prisma db seed
```

## Post-Deployment Setup

### 1. Create Admin User

Access your deployed app and navigate to `/admin` to create the first admin user, or run the seed script:

```bash
npm run seed
```

Default admin credentials:

- Email: `admin@example.com`
- Password: `admin123`

### 2. Configure AI Providers

1. Log in to admin panel
2. Go to Settings
3. Configure your preferred AI provider
4. Test the connection

### 3. Set Up Teams Integration (Optional)

1. Configure Teams webhook URL in admin settings
2. Test notifications

## Domain Configuration

### Custom Domain

1. Go to Vercel Dashboard > Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` environment variable
4. Configure DNS records as instructed

### SSL Certificate

Vercel automatically provides SSL certificates for all deployments.

## Performance Optimization

The app is optimized for Vercel with:

- ✅ Static page generation where possible
- ✅ API route optimization
- ✅ Image optimization with Next.js
- ✅ Edge Config for fast configuration access
- ✅ Database connection pooling
- ✅ Serverless function optimization

## Monitoring and Analytics

### Built-in Features

- Real-time error tracking
- Performance monitoring
- User activity logs
- AI analysis metrics

### Vercel Analytics (Optional)

Add Vercel Analytics for enhanced insights:

```bash
npm install @vercel/analytics
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Verify `DATABASE_URL` format
   - Check database server accessibility
   - Ensure SSL settings are correct

2. **AI Provider Errors**

   - Verify API keys in Edge Config or environment variables
   - Check provider rate limits
   - Ensure correct model names

3. **Authentication Issues**
   - Verify `NEXTAUTH_SECRET` is set and secure
   - Check `NEXTAUTH_URL` matches your domain
   - Ensure cookies are enabled

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=true
```

## Support

For deployment issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Review deployment logs in Vercel Dashboard
3. Check the [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## Security Checklist

- [ ] Strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Secure database connection (SSL enabled)
- [ ] API keys stored securely (Edge Config or Environment Variables)
- [ ] Custom domain with HTTPS
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Monitor for unusual activity

---

**LogAllot Provision Error Log Analysis** is ready for production deployment on Vercel with comprehensive AI provider support and Edge Config integration.
