# 🎓 CollegeMart - Complete Campus Marketplace Platform

A modern, full-stack marketplace platform built for college students to buy, sell, and trade items within their campus community.

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

### User Features
✅ Email authentication  
✅ Create product/service listings  
✅ Upload up to 5 images (drag & drop)  
✅ Browse and search listings  
✅ Real-time chat  
✅ Make/receive offers  
✅ Secure payments (Razorpay)  
✅ Unique pickup codes  
✅ Rate and review users  
✅ Mobile responsive  

### Admin Features
✅ User verification  
✅ Dispute resolution  
✅ Platform analytics  
✅ User management  

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
# DATABASE
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1"

# SUPABASE (Get from: https://app.supabase.com/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# RAZORPAY (Get from: https://dashboard.razorpay.com/app/keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="xxxxx"
RAZORPAY_WEBHOOK_SECRET="xxxxx"

# ADMIN
ADMIN_EMAILS="admin@example.com"

# NODE
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
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration files
│   └── seed.cjs            # Seed script
├── src/
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   ├── admin/      # Admin endpoints
│   │   │   ├── auth/       # Auth endpoints
│   │   │   ├── listings/   # Listing CRUD
│   │   │   ├── chats/      # Chat endpoints
│   │   │   ├── payments/   # Payment processing
│   │   │   ├── upload/     # Image upload
│   │   │   └── webhooks/   # Razorpay webhooks
│   │   ├── auth/           # Login/Signup pages
│   │   ├── listings/       # Listing pages
│   │   ├── chats/          # Chat pages
│   │   ├── dashboard/      # User dashboard
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Homepage
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── ui/             # UI components
│   │   ├── header.tsx      # Site header
│   │   └── mobile-nav.tsx  # Mobile nav
│   └── lib/
│       ├── prisma.ts       # Prisma client
│       ├── supabase-client.ts
│       └── supabase-server.ts
├── .env                    # Environment variables
├── next.config.mjs         # Next.js config
├── tailwind.config.ts      # Tailwind config
├── tsconfig.json           # TypeScript config
├── vercel.json             # Vercel config
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

### Core Models

**Profile**
```prisma
model Profile {
  id          String   @id @db.Uuid
  email       String   @unique
  role        Role     @default(USER)
  verified    Boolean  @default(false)
  ratingAvg   Float    @default(0)
  createdAt   DateTime @default(now())
}
```

**Listing**
```prisma
model Listing {
  id          String      @id @default(uuid())
  userId      String      @db.Uuid
  title       String
  description String
  price       Decimal     @db.Decimal(12, 2)
  categoryId  String      @db.Uuid
  images      Json        # Array of URLs
  type        ListingType # PRODUCT | SERVICE
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
}
```

**Transaction**
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

**Chat**
```prisma
model Chat {
  id        String    @id @default(uuid())
  listingId String    @db.Uuid
  buyerId   String    @db.Uuid
  sellerId  String    @db.Uuid
  messages  Message[]
  createdAt DateTime  @default(now())
}
```

### Enums
```prisma
enum Role { USER, ADMIN }
enum ListingType { PRODUCT, SERVICE }
enum TransactionStatus { INITIATED, PAID, CANCELLED, REFUNDED }
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
