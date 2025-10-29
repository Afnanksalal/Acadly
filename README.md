# 🎓 CollegeMart - Complete Campus Marketplace Platform

A modern, full-stack marketplace platform built for college students to buy, sell, trade items, and discover campus events within their college community. Built with Next.js 14, TypeScript, Prisma, and Supabase.

## 🌟 Key Highlights

- 🛒 **Complete Marketplace** - Buy/sell products & services with secure payments
- 💬 **Real-Time Messaging** - Chat with buyers/sellers, make offers, negotiate prices
- 🔐 **Secure Transactions** - Razorpay integration with unique pickup codes
- 📅 **Campus Events** - Discover and create college events
- ⭐ **Reputation System** - User ratings and reviews for trust
- 🛡️ **Admin Panel** - User verification, dispute resolution, analytics
- 📱 **Mobile Responsive** - Seamless experience across all devices
- 🎨 **Modern UI** - Beautiful interface with Tailwind CSS v4

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup)
- [Supabase Storage](#-supabase-storage-setup)
- [Development](#-development)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Troubleshooting](#-troubleshooting)

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router, React 18)
- **TypeScript 5.5**
- **Tailwind CSS v4**
- Custom UI components

### Backend
- **Next.js API Routes**
- **Prisma ORM 6.18**
- **PostgreSQL**
- **Zod** validation

### Services
- **Supabase** (Auth + Storage)
- **Razorpay** (Payments)
- **Vercel** (Deployment)

### Tools
- **ESLint** (Linting)
- **Prisma Studio** (Database GUI)
- **npm** (Package manager)

---

## ✨ Features

### 🛍️ Core Marketplace
- **Product & Service Listings** - Buy and sell within campus community
- **Multi-Category System** - Hierarchical category organization
- **Image Upload** - Up to 5 images per listing with drag & drop support
- **Listing Management** - Create, edit, and manage your listings
- **Advanced Search** - Browse and filter listings by category and type
- **Listing Details** - Comprehensive product information with seller profiles

### 👤 Authentication & User Management
- **Secure Authentication** - Email/password auth via Supabase
- **User Verification** - Admin approval system for new users
- **Role-Based Access** - User and Admin roles with different permissions
- **Profile Management** - Customize name, username, bio, department, year, class, phone
- **Public Profiles** - Username-based public profile pages (`/u/username`)
- **Reputation System** - User ratings with average score calculation

### 💬 Messaging & Negotiation
- **Real-Time Chat** - Direct messaging between buyers and sellers
- **Read Receipts** - Message status tracking (Sent/Delivered/Read)
- **Price Offers** - Make and receive counter-offers
- **Offer Management** - Track offer status (Proposed/Countered/Accepted/Declined/Expired/Cancelled)
- **Unread Notifications** - Badge indicators for new messages

### 💳 Payments & Transactions
- **Razorpay Integration** - Secure payment processing
- **Order Tracking** - Separate views for purchases and sales
- **Transaction Management** - Status tracking (Initiated/Paid/Cancelled/Refunded)
- **Pickup Codes** - Unique codes generated for secure item handoffs
- **Pickup Confirmation** - Seller confirms pickup with buyer's code

### ⭐ Reviews & Ratings
- **User Reviews** - Rate and review after completed transactions
- **5-Star System** - Rating with optional comments
- **Average Ratings** - Automatic calculation of user reputation
- **Review History** - View all reviews received on profile

### 📅 Events Management
- **Create Events** - Post campus events with details
- **Event Discovery** - Browse upcoming campus events
- **Event Details** - Title, description, venue, date/time, host information
- **Event Status** - Track status (Upcoming/Ongoing/Completed/Cancelled/Rescheduled)
- **Event Images** - Upload event banners and photos

### 🛡️ Admin Dashboard
- **User Verification** - Approve or reject new user registrations
- **Dispute Resolution** - Handle transaction disputes with priority levels
- **Dispute Management** - Multiple dispute reasons (Not as described, Not received, Damaged, Fake, etc.)
- **Admin Actions** - Track all administrative actions taken
- **Platform Analytics** - KPIs including user count, verified users, active listings, transactions
- **Content Moderation** - Monitor recent listings and user activity

### 🔒 Security & Policies
- **Checkout Policy** - Clear transaction guidelines
- **Privacy Policy** - User data protection information
- **Terms of Service** - Platform usage terms
- **Secure Uploads** - File validation and size limits
- **Webhook Security** - Razorpay signature verification
- **Row-Level Security** - Database-level access control

### 🎨 UI/UX
- **Fully Responsive** - Mobile-first design approach
- **Modern UI** - Built with Tailwind CSS v4
- **Theme Support** - Dark/light mode compatibility
- **Mobile Navigation** - Smooth hamburger menu with animations
- **Toast Notifications** - User feedback for actions
- **Loading States** - Skeleton screens and spinners
- **Error Handling** - Graceful error messages and fallbacks

---

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+
- **Git**
- **Supabase Account** ([Sign up](https://supabase.com))
- **Razorpay Account** ([Sign up](https://razorpay.com))
- **PostgreSQL Database**

---

## 🚀 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/collegemart.git
cd collegemart

# Install dependencies
npm install
```

---

## 🔐 Environment Setup

### 1. Create .env file

```bash
cp .env.example .env
```

### 2. Add your credentials to .env

```env
# Database
# Connection Pooler URL (for app runtime - use Transaction mode from Supabase)
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct Connection URL (for migrations - use Session mode from Supabase)
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

# Admin (comma-separated emails)
ADMIN_EMAILS="admin@example.com,admin2@example.com"

# Optional: Node Environment
NODE_ENV="development"
```

---

## 🗄️ Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (creates categories & admin users)
npx prisma db seed

# Open Prisma Studio (optional)
npx prisma studio
```

---

## 📦 Supabase Storage Setup

### Step 1: Create Bucket

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Storage** → **New bucket**
4. Configure:
   - Name: `images`
   - ✅ Public bucket: **CHECKED**
   - File size limit: 5242880 (5MB)
5. Click **Create**

### Step 2: Add Policies

Go to **SQL Editor** and run:

```sql
-- Upload policy
CREATE POLICY "Users can upload images to their folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Read policy
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'images');

-- Delete policy
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 💻 Development

### Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npx tsc --noEmit         # Type check

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open database GUI
```

---

## 🚀 Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Configure:
   - Framework: **Next.js**
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`

### 3. Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add ALL variables from `.env`

### 4. Deploy

Click **Deploy**

### 5. Configure Razorpay Webhook

1. Go to Razorpay Dashboard → Webhooks
2. Add URL: `https://your-domain.vercel.app/api/webhooks/razorpay`
3. Select events: `payment.captured`, `payment.failed`, `order.paid`
4. Copy webhook secret to Vercel env vars

---

## 📁 Project Structure

```
collegemart/
├── prisma/
│   ├── schema.prisma       # Database schema (20+ models)
│   ├── migrations/         # Migration files
│   └── seed.cjs            # Seed script (categories & admin)
├── src/
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   ├── admin/      # Admin endpoints (verify users, disputes)
│   │   │   ├── auth/       # Auth endpoints
│   │   │   ├── categories/ # Category management
│   │   │   ├── chats/      # Chat CRUD operations
│   │   │   ├── disputes/   # Dispute management
│   │   │   ├── events/     # Event CRUD
│   │   │   ├── listings/   # Listing CRUD
│   │   │   ├── messages/   # Message operations
│   │   │   ├── offers/     # Offer management
│   │   │   ├── payments/   # Razorpay payment processing
│   │   │   ├── pickups/    # Pickup code confirmation
│   │   │   ├── profile/    # Profile updates
│   │   │   ├── reviews/    # Review system
│   │   │   ├── transactions/ # Transaction management
│   │   │   ├── upload/     # Image upload to Supabase
│   │   │   └── webhooks/   # Razorpay webhooks
│   │   ├── admin/          # Admin dashboard page
│   │   ├── auth/           # Login/Signup pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── chats/          # Chat pages
│   │   │   └── [id]/       # Individual chat view
│   │   ├── dashboard/      # User/Admin dashboard
│   │   ├── events/         # Events pages
│   │   │   ├── new/        # Create event
│   │   │   └── [id]/       # Event details
│   │   ├── listings/       # Listing pages
│   │   │   ├── new/        # Create listing
│   │   │   └── [id]/       # Listing details
│   │   ├── orders/         # Order tracking
│   │   │   └── [id]/       # Order details
│   │   ├── policies/       # Legal pages
│   │   │   ├── checkout/
│   │   │   ├── privacy/
│   │   │   └── terms/
│   │   ├── profile/        # User profile management
│   │   ├── reviews/        # Reviews page
│   │   ├── transactions/   # Transaction history
│   │   │   └── [id]/       # Transaction details
│   │   ├── u/              # Public user profiles
│   │   │   └── [username]/ # Username-based profiles
│   │   ├── layout.tsx      # Root layout with header
│   │   ├── page.tsx        # Homepage
│   │   ├── middleware.ts   # Auth middleware
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── ui/             # Reusable UI components
│   │   ├── header.tsx      # Site header with nav
│   │   ├── mobile-nav.tsx  # Mobile navigation
│   │   └── logout-button.tsx
│   └── lib/
│       ├── prisma.ts       # Prisma client singleton
│       ├── supabase-client.ts # Client-side Supabase
│       └── supabase-server.ts # Server-side Supabase
├── .env                    # Environment variables
├── .env.example            # Environment template
├── next.config.mjs         # Next.js config
├── tailwind.config.ts      # Tailwind CSS v4 config
├── tsconfig.json           # TypeScript config
├── vercel.json             # Vercel deployment config
└── package.json            # Dependencies
```

---

## 📡 API Documentation

### Authentication
All protected routes require Supabase JWT in cookies.

### Listings

**GET /api/listings**  
Get all active listings

**POST /api/listings**  
Create listing
```json
{
  "title": "Calculus Textbook",
  "description": "Like new",
  "price": 500,
  "categoryId": "uuid",
  "type": "PRODUCT",
  "images": ["url1", "url2"]
}
```

### Upload

**POST /api/upload**  
Upload image (multipart/form-data)

Response:
```json
{
  "url": "https://...supabase.co/storage/.../image.jpg",
  "filename": "user-id/timestamp.jpg"
}
```

**DELETE /api/upload?filename=xxx**  
Delete image

### Payments

**POST /api/payments/create-order**  
Create Razorpay order
```json
{
  "amount": 500,
  "receipt": "optional"
}
```

**POST /api/webhooks/razorpay**  
Handle payment webhooks (signature verified)

---

## 🗃️ Database Schema

### Core Models (20+ tables)

**Profile** - User accounts
```prisma
model Profile {
  id          String   @id @db.Uuid
  email       String   @unique
  name        String?
  username    String?  @unique
  avatarUrl   String?
  phone       String?
  department  String?
  year        String?
  class       String?
  bio         String?
  role        Role     @default(USER)
  verified    Boolean  @default(false)
  ratingAvg   Float    @default(0)
  ratingCount Int      @default(0)
  createdAt   DateTime @default(now())
}
```

**Listing** - Products and services
```prisma
model Listing {
  id               String      @id @default(uuid())
  userId           String      @db.Uuid
  title            String
  description      String
  price            Decimal     @db.Decimal(12, 2)
  categoryId       String      @db.Uuid
  images           Json        # Array of URLs
  type             ListingType # PRODUCT | SERVICE
  isActive         Boolean     @default(true)
  requiresApproval Boolean     @default(false)
  createdAt        DateTime    @default(now())
}
```

**Transaction** - Payment records
```prisma
model Transaction {
  id                String            @id @default(uuid())
  buyerId           String            @db.Uuid
  sellerId          String            @db.Uuid
  listingId         String            @db.Uuid
  amount            Decimal           @db.Decimal(12, 2)
  status            TransactionStatus
  razorpayOrderId   String?
  razorpayPaymentId String?
  createdAt         DateTime          @default(now())
}
```

**Chat** - Messaging system
```prisma
model Chat {
  id        String    @id @default(uuid())
  listingId String    @db.Uuid
  buyerId   String    @db.Uuid
  sellerId  String    @db.Uuid
  messages  Message[]
  offers    Offer[]
  createdAt DateTime  @default(now())
}
```

**Message** - Chat messages
```prisma
model Message {
  id         String     @id @default(uuid())
  chatId     String     @db.Uuid
  senderId   String     @db.Uuid
  text       String
  readStatus ReadStatus @default(SENT)
  createdAt  DateTime   @default(now())
}
```

**Offer** - Price negotiations
```prisma
model Offer {
  id         String      @id @default(uuid())
  chatId     String      @db.Uuid
  proposerId String      @db.Uuid
  price      Decimal     @db.Decimal(12, 2)
  status     OfferStatus @default(PROPOSED)
  createdAt  DateTime    @default(now())
  expiresAt  DateTime?
}
```

**Pickup** - Secure item handoff
```prisma
model Pickup {
  id            String       @id @default(uuid())
  transactionId String       @unique @db.Uuid
  pickupCode    String
  status        PickupStatus @default(GENERATED)
  createdAt     DateTime     @default(now())
  confirmedAt   DateTime?
}
```

**Review** - User ratings
```prisma
model Review {
  id            String      @id @default(uuid())
  transactionId String      @db.Uuid
  reviewerId    String      @db.Uuid
  revieweeId    String      @db.Uuid
  rating        Int
  comment       String?
  helpful       Boolean     @default(true)
  createdAt     DateTime    @default(now())
}
```

**Dispute** - Conflict resolution
```prisma
model Dispute {
  id            String          @id @default(uuid())
  transactionId String          @db.Uuid
  reporterId    String          @db.Uuid
  subject       String
  description   String
  reason        DisputeReason   @default(OTHER)
  evidence      Json?
  status        DisputeStatus   @default(OPEN)
  priority      DisputePriority @default(MEDIUM)
  createdAt     DateTime        @default(now())
  resolvedAt    DateTime?
  resolution    String?
  refundAmount  Decimal?        @db.Decimal(12, 2)
}
```

**Event** - Campus events
```prisma
model Event {
  id          String   @id @default(uuid())
  creatorId   String   @db.Uuid
  title       String
  description String
  venue       String
  hostName    String
  imageUrl    String?
  startTime   DateTime
  endTime     DateTime?
  status      String   # UPCOMING, ONGOING, COMPLETED, CANCELLED, RESCHEDULED
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

### Enums
```prisma
enum Role { USER, ADMIN }
enum ListingType { PRODUCT, SERVICE }
enum TransactionStatus { INITIATED, PAID, CANCELLED, REFUNDED }
enum PickupStatus { GENERATED, CONFIRMED }
enum OfferStatus { PROPOSED, COUNTERED, ACCEPTED, DECLINED, EXPIRED, CANCELLED }
enum ReadStatus { SENT, DELIVERED, READ }
enum DisputeStatus { OPEN, IN_REVIEW, RESOLVED, REJECTED }
enum DisputeReason { NOT_AS_DESCRIBED, NOT_RECEIVED, DAMAGED, FAKE, SELLER_UNRESPONSIVE, BUYER_UNRESPONSIVE, PAYMENT_ISSUE, OTHER }
enum DisputePriority { LOW, MEDIUM, HIGH, URGENT }
```

---

## 🐛 Troubleshooting

### Build Errors

**"Prisma Client not generated"**
```bash
npx prisma generate
npm run build
```

**"Module not found"**
```bash
rm -rf node_modules .next
npm install
```

### Database Errors

**"Can't reach database"**
- Check `DATABASE_URL`
- Use connection pooling URL
- Verify firewall settings

**"Migration failed"**
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Storage Errors

**"Bucket not found"**
- Create `images` bucket in Supabase
- Make it PUBLIC
- See Supabase Storage Setup above

**"Permission denied"**
- Set up storage policies (see SQL above)
- Check `SUPABASE_SERVICE_ROLE_KEY`

### Payment Errors

**"Razorpay order failed"**
- Verify API keys
- Use test keys for development
- Check account is activated

**"Webhook signature invalid"**
- Check `RAZORPAY_WEBHOOK_SECRET`
- Verify webhook URL
- Ensure webhook is active

---

## 🔒 Security

- JWT authentication (Supabase)
- Row-level security (RLS)
- Role-based access control
- Input validation (Zod)
- SQL injection prevention (Prisma)
- Webhook signature verification
- File upload validation
- Security headers (X-Frame-Options, etc.)

---

## 📊 Quick Start Summary

```bash
# 1. Clone & Install
git clone <repo>
cd collegemart
npm install

# 2. Environment
cp .env.example .env
# Edit .env with your credentials

# 3. Database
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# 4. Supabase Storage
# Create 'images' bucket (see above)
# Add storage policies (see SQL above)

# 5. Run
npm run dev
# Open http://localhost:3000

# 6. Deploy
git push origin main
# Import to Vercel
# Add env vars
# Deploy!
```

---

## 📞 Support

- **Issues**: GitHub Issues
- **Docs**: See project folder for detailed guides
- **Email**: support@collegemart.com

---

## 📄 License

MIT License

---

## 🙏 Built With

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Supabase](https://supabase.com/)
- [Razorpay](https://razorpay.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

---

**Made with ❤️ for college students**
