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
git clone https://github.com/Afnanksalal/Acadly/
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
