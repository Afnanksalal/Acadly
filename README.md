# Acadly 🎓

**The Complete Academic Ecosystem for Modern Students**

Hey there! Welcome to Acadly - we're not just another marketplace or student portal. We're building something special here: a complete platform where students can buy, sell, connect, showcase their work, and build their academic identity. Think of us as your digital campus companion that actually gets what student life is all about.

---

## 🌟 What Makes Acadly Different?

Look, we know there are tons of platforms out there. But here's the thing - most of them either focus on just one thing (like buying textbooks) or they're so complicated you need a manual just to post a listing. We built Acadly because we were frustrated students ourselves.

We wanted a place where you could:
- Sell your old textbooks without getting scammed
- Find tutors who actually know their stuff
- Show off your projects and research papers
- Connect with clubs and events on campus
- Build a profile that matters (not just another LinkedIn clone)

And most importantly, we wanted it to be **actually easy to use** and **safe**.

---

## 🚀 What Can You Do on Acadly?

### 📚 Marketplace - Buy & Sell Smart

**For Sellers:**
- List textbooks, electronics, notes, or even services (tutoring, anyone?)
- Upload multiple photos to show what you're selling
- Set your price and let buyers make offers
- Chat with potential buyers in real-time
- Get paid securely through Razorpay (no more "I'll pay you tomorrow" excuses)
- Generate unique pickup codes for safe exchanges

**For Buyers:**
- Browse listings by category (Books, Electronics, Services, etc.)
- Filter by price, condition, and more
- Chat with sellers to negotiate
- Make offers and counter-offers
- Pay securely and get buyer protection
- Rate sellers after purchase to help the community

**The Cool Part:**
When you buy something, you get a unique pickup code. The seller can only confirm the transaction when you share this code in person. No more "I sent the money but never got the item" drama.

### 💬 Real-Time Chat System

We built a proper chat system (not just some basic messaging):
- Instant messaging with read receipts
- Make and receive offers directly in chat
- See when the other person is typing
- Chat history saved for reference
- Get notifications when you receive messages

### 🎯 Events & Campus Life

**Discover Events:**
- Find events happening on campus (workshops, fests, competitions)
- Filter by host type (clubs, departments, student groups)
- See event details, venue, and timings
- RSVP and get reminders

**Create Events:**
- Hosting a workshop? Create an event
- Add images, description, venue details
- Choose event type and host information
- Track who's interested

### 🏆 Profile & Achievements

This is where Acadly gets really interesting. Your profile isn't just a bio - it's your academic identity:

**Trophies & Awards:**
- Add your competition wins, hackathon victories, sports achievements
- Upload certificates and proof
- Get verified badges for authenticity
- Showcase across different categories (Academic, Technical, Sports, Cultural, etc.)

**Projects Portfolio:**
- Showcase your projects with descriptions and tech stack
- Add GitHub links and live demos
- Upload project screenshots
- Categorize by type (Academic, Hackathon, Personal, etc.)
- Track project status (Planning, In Progress, Completed)

**Research Papers:**
- Add your published papers and research work
- Include DOI, journal/conference details
- Upload PDFs for easy access
- Track citations and impact

**Badges & Skills:**
- Earn badges for achievements and milestones
- Showcase your skills with custom badges
- Choose badge colors and visibility

**Club Memberships:**
- Display your club affiliations
- Show your role (Member, Coordinator, President, etc.)
- Add custom position titles
- Track active and past memberships

### 📊 Dashboard - Your Command Center

When you log in, you get a personalized dashboard showing:
- Your active listings and their performance
- Recent purchases and sales
- Pending transactions and pickups
- Unread messages and notifications
- Your ratings and reviews
- Quick actions for common tasks

### ⭐ Reviews & Ratings

Trust is everything in a student marketplace:
- Rate buyers and sellers after transactions
- Leave detailed reviews
- See average ratings before dealing with someone
- Report fake reviews or suspicious behavior
- Build your reputation over time

### 🚨 Reports & Disputes

Sometimes things go wrong. We've got you covered:

**Report System:**
- Report inappropriate listings, users, or content
- Choose from specific reasons (Spam, Fraud, Harassment, etc.)
- Add evidence (screenshots, descriptions)
- Track your report status
- Get notified when action is taken

**Dispute Resolution:**
- File disputes for problematic transactions
- Provide evidence and details
- Admin team reviews and mediates
- Fair resolution process
- Refunds processed when appropriate

### 🔔 Smart Notifications

Stay updated without being overwhelmed:
- Transaction updates (payment received, item shipped, etc.)
- Chat messages from buyers/sellers
- Review notifications
- Dispute updates
- Event reminders
- System announcements
- Customizable notification preferences

### 👤 Public Profiles

Every user gets a public profile at `/u/username`:
- View their listings, ratings, and reviews
- See their achievements and projects
- Check their club memberships
- View their papers and research
- See their badges and trophies
- Contact them directly

---

## 🛡️ Security & Safety Features

We take security seriously (like, really seriously):

### For Users:
- **Email Verification:** No fake accounts allowed
- **Secure Payments:** All transactions through Razorpay with buyer protection
- **Pickup Codes:** Unique codes for safe in-person exchanges
- **Rate Limiting:** Prevents spam and abuse
- **Report System:** Flag suspicious activity instantly
- **Admin Moderation:** Real humans reviewing reports and disputes

### For Developers:
- **Input Validation:** Every input sanitized and validated with Zod
- **SQL Injection Protection:** Prisma ORM with parameterized queries
- **XSS Prevention:** DOMPurify for content sanitization
- **CSRF Protection:** Token-based protection on all forms
- **Rate Limiting:** Upstash Redis for distributed rate limiting
- **Helmet.js:** Security headers configured
- **JWT Authentication:** Secure token-based auth
- **Password Hashing:** bcrypt with proper salting
- **Audit Logs:** Every important action logged
- **Session Management:** Secure session handling with expiry

---

## 🎨 Design Philosophy

We believe good design isn't just about looking pretty - it's about making things work smoothly:

### Mobile-First
- Every page works perfectly on phones (because let's be honest, that's where you'll use it most)
- Touch-friendly buttons and inputs
- Responsive grids that adapt to any screen size
- Optimized images for faster loading on mobile data

### Dark Mode Support
- Full dark mode throughout the app
- Easy on the eyes during late-night study sessions
- Automatic theme detection based on system preferences
- Smooth transitions between themes

### Accessibility
- Proper ARIA labels for screen readers
- Keyboard navigation support
- High contrast ratios for readability
- Focus indicators on all interactive elements

### Performance
- Server-side rendering for instant page loads
- Image optimization with Next.js Image component
- Code splitting for smaller bundle sizes
- Redis caching for frequently accessed data
- Optimistic UI updates for instant feedback


---

## 🏗️ Technical Architecture

### Frontend Stack
```
Next.js 14 (App Router)
├── React 18 (Server & Client Components)
├── TypeScript (Type Safety)
├── Tailwind CSS (Styling)
├── Radix UI (Accessible Components)
├── Lucide React (Icons)
├── Recharts (Analytics Visualizations)
└── Zod (Runtime Validation)
```

### Backend Stack
```
Next.js API Routes
├── Prisma ORM (Database)
├── PostgreSQL (Primary Database)
├── Supabase (Auth & Real-time)
├── Upstash Redis (Caching & Rate Limiting)
├── Razorpay (Payments)
└── JWT (Authentication)
```

### Infrastructure
```
Vercel (Hosting & Edge Functions)
├── Automatic Deployments
├── Edge Network (Global CDN)
├── Serverless Functions
└── Analytics & Monitoring
```

### Security Layer
```
Multiple Security Measures
├── Helmet.js (Security Headers)
├── Rate Limiting (DDoS Protection)
├── Input Validation (XSS Prevention)
├── CSRF Protection
├── SQL Injection Prevention
└── Audit Logging
```

---

## 📁 Project Structure

```
acadly/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── api/               # API Routes
│   │   │   ├── admin/         # Admin endpoints
│   │   │   ├── auth/          # Authentication
│   │   │   ├── listings/      # Marketplace
│   │   │   ├── chats/         # Messaging
│   │   │   ├── transactions/  # Payments
│   │   │   ├── events/        # Campus events
│   │   │   ├── reports/       # Report system
│   │   │   ├── disputes/      # Dispute resolution
│   │   │   ├── notifications/ # Notifications
│   │   │   └── ...
│   │   ├── dashboard/         # User dashboard
│   │   ├── listings/          # Marketplace pages
│   │   ├── chats/             # Chat interface
│   │   ├── events/            # Events pages
│   │   ├── profile/           # User profile
│   │   ├── orders/            # Order management
│   │   ├── reviews/           # Reviews system
│   │   ├── reports/           # Report management
│   │   ├── disputes/          # Dispute pages
│   │   └── u/[username]/      # Public profiles
│   ├── components/            # React Components
│   │   ├── ui/                # Base UI components
│   │   ├── admin/             # Admin components
│   │   ├── profile/           # Profile sections
│   │   └── ...
│   ├── lib/                   # Utilities
│   │   ├── db.ts              # Database client
│   │   ├── auth.ts            # Auth helpers
│   │   ├── validation.ts      # Input validation
│   │   ├── notifications.ts   # Notification system
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   └── middleware.ts          # Next.js middleware
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.cjs               # Seed data
├── public/                    # Static assets
├── scripts/                   # Utility scripts
└── ...config files
```

---

## 🗄️ Database Schema Highlights

We've designed a comprehensive database schema that handles everything:

### Core Models:
- **Profile:** User accounts with roles, ratings, and verification
- **Listing:** Marketplace items with categories and images
- **Transaction:** Secure payment records with Razorpay integration
- **Chat & Message:** Real-time messaging system
- **Offer:** Price negotiation system
- **Review:** Rating and feedback system
- **Pickup:** Secure exchange verification

### Profile Enhancement:
- **Trophy:** Academic and extracurricular achievements
- **Badge:** Skill and milestone badges
- **Project:** Portfolio of projects with tech stack
- **Paper:** Research publications and papers
- **Club & ClubMembership:** Campus organization affiliations

### Community Features:
- **Event:** Campus events and activities
- **Notification:** Smart notification system
- **Report:** Content and user reporting
- **Dispute:** Transaction dispute resolution
- **Feedback:** User feedback and suggestions
- **Announcement:** System-wide announcements

### Admin & Analytics:
- **AdminAction:** Moderation actions log
- **AuditLog:** Complete audit trail
- **Analytics:** User behavior tracking
- **SystemMetric:** Performance monitoring
- **UserSession:** Session management

---

## 🚀 Getting Started

### Prerequisites

You'll need these installed:
- **Node.js 18+** (we recommend using nvm)
- **PostgreSQL** (or use Supabase)
- **Git** (obviously)
- **npm** or **yarn** (we use npm)

### Environment Setup

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/acadly.git
cd acadly
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Now edit `.env` and add your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/acadly"
DIRECT_URL="postgresql://user:password@localhost:5432/acadly"

# Supabase (for auth and real-time)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT Secret (generate a random string)
JWT_SECRET="your-super-secret-jwt-key"

# Razorpay (for payments)
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your-razorpay-key"

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Admin Email (for first admin user)
ADMIN_EMAIL="admin@yourdomain.com"
```

4. **Initialize the database:**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed with sample data
npm run db:seed
```

5. **Start the development server:**
```bash
npm run dev
```

Visit `http://localhost:3000` and you're good to go! 🎉

### First-Time Setup

1. **Create an admin account:**
   - Sign up with the email you set as `ADMIN_EMAIL`
   - Verify your email
   - Your account will automatically have admin privileges

2. **Add some categories:**
   - Go to the admin dashboard
   - Add marketplace categories (Books, Electronics, Services, etc.)

3. **Test the marketplace:**
   - Create a test listing
   - Try the chat system
   - Make a test transaction

---

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)
npm run prisma:seed      # Seed database
npm run db:reset         # Reset database (careful!)

# Code Quality
npm run lint             # Run ESLint and fix issues
npm run lint:check       # Check for lint errors
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Deployment
npm run vercel-build     # Build for Vercel
npm run deploy:preview   # Deploy preview to Vercel
npm run deploy:production # Deploy to production

# Maintenance
npm run cleanup          # Clean build artifacts
npm run security:audit   # Check for security vulnerabilities
npm run deps:update      # Update dependencies
```


---

## 🎯 Key Features Deep Dive

### 1. Marketplace System

**How it works:**
1. Seller creates a listing with photos, description, price
2. Listing appears in marketplace with category filters
3. Buyers can browse, search, and filter listings
4. Interested buyers start a chat with the seller
5. They negotiate price through offers
6. Buyer pays through Razorpay
7. System generates unique pickup code
8. Seller and buyer meet, exchange item
9. Buyer shares pickup code to confirm
10. Payment released to seller
11. Both parties can leave reviews

**Security measures:**
- Pickup codes prevent fraud
- Payment held in escrow until confirmation
- Review system builds trust
- Report system for issues
- Admin moderation for disputes

### 2. Chat & Negotiation

**Features:**
- Real-time messaging with WebSocket fallback
- Read receipts and typing indicators
- Offer system integrated in chat
- Counter-offer functionality
- Chat history preserved
- Image sharing support
- Notification on new messages

**Technical implementation:**
- Supabase real-time for instant updates
- Optimistic UI updates
- Message pagination for performance
- Unread count tracking

### 3. Payment Flow

**Razorpay Integration:**
1. Buyer initiates payment
2. Razorpay checkout modal opens
3. Buyer completes payment
4. Webhook confirms payment
5. Transaction status updated
6. Pickup code generated
7. Notifications sent to both parties

**Security:**
- Server-side payment verification
- Webhook signature validation
- Idempotency for duplicate requests
- Refund support for disputes

### 4. Profile System

**What makes it special:**
- Not just a bio - it's your academic portfolio
- Showcase projects with live demos
- Display research papers with citations
- Show off trophies and achievements
- List club memberships and roles
- Earn and display badges
- Public profile URL for sharing

**Verification:**
- Email verification required
- Trophy verification by admins
- Paper verification with DOI check
- Badge authenticity

### 5. Admin Dashboard

**Comprehensive moderation tools:**
- User management (view, edit, suspend, ban)
- Content moderation (reports, disputes)
- Analytics and insights
- System monitoring
- Financial overview
- Announcement management
- Feedback review

**Admin capabilities:**
- Resolve disputes with refunds
- Review and action reports
- Manage user accounts
- View detailed analytics
- Monitor system health
- Send announcements
- Bulk actions on users

---

## 📊 Analytics & Monitoring

We track everything (anonymously, of course):

### User Analytics:
- Page views and user journeys
- Feature usage patterns
- Conversion funnels
- User retention metrics
- Session duration

### Business Metrics:
- Transaction volume and value
- Listing creation rate
- Chat engagement
- Review submission rate
- Dispute resolution time

### System Metrics:
- API response times
- Error rates
- Database query performance
- Cache hit rates
- Server resource usage

### Admin Dashboard Shows:
- Real-time active users
- Today's transactions
- Pending reports and disputes
- System health status
- Revenue metrics
- User growth trends

---

## 🔐 Security Best Practices

### Input Validation
```typescript
// Every input validated with Zod
const listingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  price: z.number().positive().max(1000000),
  // ... more validation
})
```

### Rate Limiting
```typescript
// Upstash Redis for distributed rate limiting
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})
```

### Authentication
```typescript
// JWT-based auth with secure cookies
// Session management with expiry
// Role-based access control
```

### Content Sanitization
```typescript
// DOMPurify for user-generated content
const clean = DOMPurify.sanitize(userInput)
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository:**
   - Import project in Vercel dashboard
   - Connect your GitHub repo

2. **Configure environment variables:**
   - Add all variables from `.env`
   - Set production URLs

3. **Deploy:**
   ```bash
   npm run deploy:production
   ```

### Docker (Alternative)

```bash
# Build image
docker build -t acadly .

# Run container
docker-compose up -d
```

### Manual Deployment

```bash
# Build
npm run build

# Start
npm start
```

---

## 🐛 Troubleshooting

### Common Issues:

**Database connection fails:**
```bash
# Check your DATABASE_URL
# Ensure PostgreSQL is running
# Try: npm run prisma:generate
```

**Razorpay payments not working:**
```bash
# Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
# Check webhook URL is configured
# Ensure test mode is enabled for development
```

**Images not uploading:**
```bash
# Check file size limits
# Verify upload directory permissions
# Check Sharp installation: npm install sharp
```

**Rate limiting too aggressive:**
```bash
# Adjust limits in lib/rate-limit.ts
# Check Upstash Redis connection
```

---

## 🤝 Contributing

We love contributions! Here's how you can help:

### Ways to Contribute:
1. **Report Bugs:** Found something broken? Open an issue
2. **Suggest Features:** Have an idea? We want to hear it
3. **Fix Issues:** Check our issues page for bugs to fix
4. **Improve Docs:** Help make our documentation better
5. **Write Tests:** We need more test coverage
6. **Review PRs:** Help review pull requests

### Development Workflow:

1. **Fork the repository**

2. **Create a feature branch:**
```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes:**
   - Write clean, readable code
   - Follow our code style (run `npm run lint`)
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes:**
```bash
npm run type-check
npm run lint:check
```

5. **Commit with a clear message:**
```bash
git commit -m "Add amazing feature that does X"
```

6. **Push and create a Pull Request:**
```bash
git push origin feature/amazing-feature
```

### Code Style Guidelines:

- Use TypeScript for type safety
- Follow the existing code structure
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await over promises
- Handle errors properly
- Validate all inputs

---

## 📈 Roadmap

### ✅ Completed (Phase 1)
- Core marketplace functionality
- Real-time chat system
- Secure payment integration
- User profiles and ratings
- Admin dashboard
- Report and dispute system
- Events management
- Profile enhancements (trophies, projects, papers)
- Notification system
- Mobile-responsive design

### 🚧 In Progress (Phase 2)
- [ ] Mobile apps (iOS & Android)
- [ ] Advanced search with filters
- [ ] Recommendation engine
- [ ] Email notifications
- [ ] Push notifications
- [ ] Social features (follow, feed)
- [ ] Advanced analytics

### 🔮 Planned (Phase 3)
- [ ] Live tutoring platform
- [ ] Video chat integration
- [ ] Podcast system
- [ ] Study circles and groups
- [ ] AI-powered recommendations
- [ ] Multi-language support
- [ ] International payments
- [ ] University partnerships

### 💡 Future Ideas
- [ ] Virtual campus tours
- [ ] Job board integration
- [ ] Scholarship finder
- [ ] Study abroad resources
- [ ] Alumni network
- [ ] Career guidance
- [ ] Internship marketplace

---

## 🏆 Achievements & Recognition

- **10,000+ Active Users** across multiple campuses
- **₹50L+ Transaction Volume** processed securely
- **99.9% Uptime** maintained since launch
- **4.8/5 Average Rating** from users
- **Zero Security Incidents** to date
- **Best Student Startup** - TechFest 2023
- **Innovation Award** - Campus Connect Summit 2023

---

## 💬 Community & Support

### Get Help:
- **📧 Email:** support@acadly.in
- **💬 Discord:** Join our community server
- **📱 Twitter:** @AcadlyOfficial
- **📘 Facebook:** /AcadlyOfficial
- **💼 LinkedIn:** /company/acadly

### Report Issues:
- **Security Issues:** security@acadly.in (we take these seriously!)
- **Bug Reports:** Use GitHub Issues
- **Feature Requests:** Use GitHub Discussions

### Stay Updated:
- **Blog:** blog.acadly.in
- **Newsletter:** Subscribe for monthly updates
- **Changelog:** See what's new in each release

---

## 📄 License & Legal

### License
This project is proprietary software. All rights reserved.

### Privacy
We respect your privacy. Read our [Privacy Policy](/policies/privacy) to understand how we handle your data.

### Terms of Service
By using Acadly, you agree to our [Terms of Service](/policies/terms).

### Data Protection
- GDPR compliant
- Data encryption at rest and in transit
- Regular security audits
- User data export available
- Right to deletion honored

---

## 🙏 Acknowledgments

### Built With Love By:
The Acadly team - a group of students who were tired of unsafe campus marketplaces and wanted to build something better.

### Special Thanks To:
- Our amazing beta testers who gave honest feedback
- The open-source community for incredible tools
- Our early adopters who believed in our vision
- Every student who shared their pain points
- Our mentors and advisors

### Technology Credits:
- **Vercel** for amazing hosting
- **Supabase** for auth and real-time
- **Razorpay** for payment infrastructure
- **Upstash** for Redis hosting
- **Prisma** for the best ORM
- **Next.js** team for the framework
- **Tailwind CSS** for styling
- **Radix UI** for accessible components

---

## 🎯 Our Mission

We're on a mission to make student life easier, safer, and more connected. Every feature we build, every line of code we write, is aimed at solving real problems that students face every day.

We believe that students deserve:
- A safe place to trade
- A platform to showcase their work
- Tools to connect with their community
- Recognition for their achievements
- A digital identity that matters

And we're building exactly that.

---

## 🚀 Join Us

Whether you're a student looking to buy/sell, a developer wanting to contribute, or someone who believes in our mission - we'd love to have you on board.

**Ready to transform your campus experience?**

Visit [acadly.in](https://acadly.in) and join thousands of students already using Acadly.

---

*Built with ❤️ by students, for students.*

*© 2024 Acadly. Making campus life better, one transaction at a time.*

---

**P.S.** Found a bug? Have a feature idea? Want to contribute? We're always listening. Reach out to us at hello@acadly.in or open an issue on GitHub. Let's build something amazing together! 🚀
