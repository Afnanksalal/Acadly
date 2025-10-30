# Acadly - Academic Marketplace

Connect, trade, and thrive in your academic community. A comprehensive platform for campus commerce, built with Next.js, Prisma, and Supabase.

## 🚀 Features

### Core Functionality
- **User Authentication & Verification**: Secure signup/login with email verification
- **Marketplace**: Buy and sell textbooks, electronics, and services
- **Real-time Chat**: Communicate with buyers and sellers
- **Secure Payments**: Integrated with Razorpay for safe transactions
- **Pickup System**: Secure pickup codes for item exchange
- **Review System**: Rate and review other users
- **Dispute Resolution**: Admin-managed dispute system with refunds

### Advanced Features
- **Event Management**: Create and discover campus events
- **Admin Dashboard**: Comprehensive admin panel with analytics
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive data sanitization
- **Transaction Timeout**: Automatic cleanup of expired transactions
- **Refund System**: Automated and manual refund processing
- **Notification System**: Real-time notifications for all activities

### Security & Performance
- **Email Verification**: Required for critical actions
- **Rate Limiting**: Upstash Redis-based rate limiting
- **Input Sanitization**: XSS and injection protection
- **Error Handling**: Standardized error responses
- **Pagination**: Efficient data loading
- **Caching**: Optimized database queries

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Razorpay
- **File Storage**: Supabase Storage
- **Rate Limiting**: Upstash Redis
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Razorpay account for payments
- Upstash Redis for rate limiting (optional but recommended)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd acadly
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="your-supabase-pooler-url"
DIRECT_URL="your-supabase-direct-url"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_SECRET="your-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"

# Rate Limiting (Optional)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Admin
ADMIN_EMAILS="admin@acadly.in"
CRON_SECRET="your-secure-secret"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npx prisma db seed
```

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🗄️ Database Schema

### Core Models
- **Profile**: User accounts with verification status
- **Listing**: Items/services for sale
- **Transaction**: Purchase orders with payment tracking
- **Chat/Message**: Real-time communication
- **Review**: User ratings and feedback
- **Dispute**: Conflict resolution system
- **Event**: Campus events and activities

### Key Features
- **Pickup System**: Secure codes for item exchange
- **Admin Actions**: Audit trail for admin activities
- **Offers**: Price negotiation system
- **Categories**: Organized listing categories

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Enable email authentication
3. Create storage bucket named `images`
4. Configure RLS policies for security
5. Set up email templates for verification

### Razorpay Setup

1. Create Razorpay account
2. Get API keys from dashboard
3. Configure webhook endpoint: `/api/webhooks/razorpay`
4. Enable required payment methods

### Upstash Redis (Optional)

1. Create Upstash Redis database
2. Get REST URL and token
3. Configure rate limiting in middleware

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Environment Variables**
   Set all required environment variables in Vercel dashboard

3. **Domain Configuration**
   - Add custom domain (acadly.in)
   - Configure DNS settings
   - Enable HTTPS

4. **Cron Jobs**
   Vercel automatically sets up cron jobs from `vercel.json`

### Database Migration

```bash
# Production migration
npx prisma migrate deploy
```

### Post-Deployment

1. **Verify Environment**
   - Test API endpoints
   - Check database connectivity
   - Verify payment integration

2. **Admin Setup**
   - Create admin account
   - Verify admin permissions
   - Test dispute resolution

3. **Monitoring**
   - Set up error tracking
   - Monitor API performance
   - Check cron job execution

### Cron Jobs

Automatic cleanup runs daily at midnight UTC via Vercel Cron:
- Cancels expired transactions (30+ minutes old)
- Auto-completes old transactions (7+ days)

**Note**: Hobby accounts are limited to daily cron jobs. For more frequent cleanup:
1. Upgrade to Vercel Pro for hourly cron jobs (`0 */6 * * *`)
2. Use manual triggers as needed
3. Set up external cron services

Manual trigger:
```bash
curl -X GET "https://yourdomain.com/api/cron/cleanup" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📊 API Documentation

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/send-verification` - Send verification email

### Listings
- `GET /api/listings` - Get listings (paginated)
- `POST /api/listings` - Create listing
- `PUT /api/listings/[id]` - Update listing
- `DELETE /api/listings/[id]` - Delete listing

### Transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/[id]/cancel` - Cancel transaction
- `POST /api/transactions/[id]/refund` - Process refund (admin)

### Admin
- `GET /api/admin/disputes` - Get disputes
- `POST /api/admin/disputes/[id]/resolve` - Resolve dispute
- `GET /api/admin/analytics` - Get analytics data

## 🔒 Security Features

### Input Validation
- Zod schema validation
- HTML sanitization
- SQL injection protection
- XSS prevention

### Rate Limiting
- API endpoint protection
- User-based limits
- IP-based restrictions
- Webhook protection

### Authentication
- Email verification required
- Secure session management
- Role-based access control
- Admin privilege separation

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📈 Monitoring

### Key Metrics
- User registration/verification rates
- Transaction success rates
- Dispute resolution times
- API response times
- Error rates

### Logs
- Transaction events
- Payment webhooks
- Admin actions
- Security events

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@acadly.in or create an issue in the repository.

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Advanced search filters
- [ ] Bulk operations
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Social features
- [ ] AI-powered recommendations

---

Built with ❤️ for the academic community