# 🚀 Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set in Vercel:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxx..."
SUPABASE_SERVICE_ROLE_KEY="eyJxxx..."

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_SECRET="xxx"
RAZORPAY_WEBHOOK_SECRET="xxx"

# Optional: Redis for rate limiting
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"

# Security
CRON_SECRET="your-secure-cron-secret-here"
ADMIN_EMAILS="admin@acadly.in,support@acadly.in"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_NAME="Acadly"
NODE_ENV="production"
```

### 2. Supabase Configuration

#### Database Setup:
1. Create a new Supabase project
2. Run migrations: `npx prisma migrate deploy`
3. Generate Prisma client: `npx prisma generate`
4. Seed database: `npm run prisma:seed`

#### Storage Setup:
1. Create an `images` bucket in Supabase Storage
2. Set bucket to public
3. Configure RLS policies for image uploads

#### Auth Setup:
1. Configure email templates in Supabase Auth
2. Set up redirect URLs for your domain
3. Enable email confirmation

### 3. Vercel Configuration

#### Build Settings:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`

#### Function Configuration:
- **Node.js Version**: 18.x or 20.x
- **Memory**: 1024 MB (for API routes)
- **Timeout**: 30s (60s for webhooks, 300s for cron)

### 4. Domain & DNS
1. Add your custom domain in Vercel
2. Configure DNS records
3. Update `NEXT_PUBLIC_APP_URL` environment variable

## 🔧 Cookie Issues Fixed

### What Was Fixed:
1. **Supabase SSR Configuration**: Updated to use proper cookie handling
2. **Route Handler Clients**: Separate clients for different contexts
3. **Middleware Integration**: Proper auth refresh in middleware
4. **Client-Side Auth**: React context for auth state management
5. **Error Handling**: Graceful cookie error handling

### Key Files Updated:
- `src/lib/supabase-server.ts` - Server components
- `src/lib/supabase-client.ts` - Client components  
- `src/lib/supabase-route-handler.ts` - API routes
- `src/lib/supabase-middleware.ts` - Middleware
- `src/components/auth-provider.tsx` - Client auth state

## 🚀 Deployment Commands

### Quick Deploy:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Manual Deploy:
1. Push to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically on push

## 🔍 Health Checks

After deployment, verify these endpoints:

1. **App Health**: `https://your-domain.vercel.app/api/health`
2. **Supabase Health**: `https://your-domain.vercel.app/api/health/supabase`
3. **Database Health**: Check if listings load on homepage

## 🐛 Troubleshooting

### Common Issues:

#### 1. Cookie Errors
- **Fixed**: Updated Supabase client configurations
- **Verify**: Check browser console for cookie-related errors

#### 2. Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

#### 3. Database Connection Issues
- Verify `DATABASE_URL` and `DIRECT_URL`
- Check Supabase project status
- Ensure connection pooling is configured

#### 4. Environment Variables
- Double-check all required variables are set
- Ensure no trailing spaces or quotes
- Verify Supabase keys are correct

### Performance Optimization:

#### 1. Enable Turbopack (Development)
```bash
npm run dev  # Uses Turbopack by default
npm run dev:legacy  # Falls back to Webpack
```

#### 2. Bundle Analysis
```bash
npm run analyze
```

#### 3. Database Optimization
- Use connection pooling (already configured)
- Monitor query performance in Supabase dashboard
- Consider read replicas for high traffic

## 📊 Monitoring

### Vercel Analytics:
- Enable Web Analytics in Vercel dashboard
- Monitor Core Web Vitals
- Track function execution times

### Supabase Monitoring:
- Database performance metrics
- Auth usage statistics
- Storage usage tracking

### Error Tracking:
- Check Vercel function logs
- Monitor Supabase logs
- Set up error alerting

## 🔒 Security Checklist

- ✅ Environment variables secured
- ✅ CORS configured for API routes
- ✅ Rate limiting implemented
- ✅ Security headers applied
- ✅ Supabase RLS policies configured
- ✅ Input validation on all endpoints
- ✅ Admin routes protected

## 📈 Scaling Considerations

### Vercel Limits (Hobby Plan):
- 100GB bandwidth/month
- 100 serverless function executions/day
- 1 cron job/day

### Upgrade Triggers:
- High traffic (>100GB/month)
- Frequent cron jobs needed
- Team collaboration required
- Advanced analytics needed

### Database Scaling:
- Monitor connection usage
- Consider upgrading Supabase plan
- Implement caching strategies
- Optimize database queries

---

## 🎉 Deployment Complete!

Your Acadly marketplace is now live and optimized for production use with:
- ✅ Fixed cookie handling
- ✅ Turbopack compatibility  
- ✅ Vercel optimization
- ✅ Security hardening
- ✅ Performance monitoring