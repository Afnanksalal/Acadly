const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting Acadly database seed...")

  // Create categories with hierarchical structure
  const existingCategories = await prisma.category.count()
  
  if (existingCategories === 0) {
    console.log("📚 Creating categories...")
    
    // Main categories
    const mainCategories = [
      { name: "Academic Books", children: ["Textbooks", "Reference Books", "Study Guides", "Previous Year Papers"] },
      { name: "Electronics", children: ["Laptops", "Tablets", "Calculators", "Headphones", "Chargers & Cables"] },
      { name: "Stationery", children: ["Notebooks", "Pens & Pencils", "Art Supplies", "Files & Folders"] },
      { name: "Lab Equipment", children: ["Scientific Instruments", "Safety Equipment", "Chemicals", "Glassware"] },
      { name: "Furniture", children: ["Study Tables", "Chairs", "Bookshelves", "Storage"] },
      { name: "Sports & Fitness", children: ["Sports Equipment", "Gym Accessories", "Outdoor Gear"] },
      { name: "Fashion", children: ["Clothing", "Shoes", "Accessories", "Bags"] },
      { name: "Services", children: ["Tutoring", "Project Help", "Lab Assistance", "Record Writing", "Typing Services"] },
    ]

    for (const mainCat of mainCategories) {
      // Create parent category
      const parent = await prisma.category.create({
        data: { name: mainCat.name }
      })
      
      // Create child categories
      for (const childName of mainCat.children) {
        await prisma.category.create({
          data: { 
            name: childName,
            parentId: parent.id
          }
        })
      }
    }
    
    const totalCategories = await prisma.category.count()
    console.log(`✅ Created ${totalCategories} categories`)
  } else {
    console.log(`ℹ️  Categories already exist (${existingCategories} found), skipping creation`)
  }

  // Setup admin users
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  
  console.log("👑 Setting up admin users...")
  for (const adminEmail of adminEmails) {
    const existing = await prisma.profile.findUnique({ where: { email: adminEmail } })
    if (existing && existing.role !== "ADMIN") {
      await prisma.profile.update({ 
        where: { id: existing.id }, 
        data: { role: "ADMIN", verified: true } 
      })
      console.log(`✅ Elevated ${adminEmail} to ADMIN`)
    } else if (existing) {
      console.log(`ℹ️  ${adminEmail} is already ADMIN`)
    } else {
      console.log(`ℹ️  ${adminEmail} will be elevated on first login`)
    }
  }

  // Create sample events (only in development)
  if (process.env.NODE_ENV === "development") {
    const existingEvents = await prisma.event.count()
    
    if (existingEvents === 0) {
      console.log("🎉 Creating sample events...")
      
      // We need at least one user to create events
      const adminUser = await prisma.profile.findFirst({
        where: { role: "ADMIN" }
      })
      
      if (adminUser) {
        const sampleEvents = [
          {
            title: "Welcome to Acadly - Campus Marketplace Launch",
            description: "Join us for the official launch of Acadly, your new campus marketplace! Learn how to buy, sell, and connect with fellow students. Free refreshments and exciting prizes!",
            venue: "Main Auditorium",
            hostType: "COLLEGE",
            hostName: "Acadly Team",
            startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
            creatorId: adminUser.id
          },
          {
            title: "Study Group - Data Structures & Algorithms",
            description: "Weekly study group for DSA preparation. Bring your laptops and let's solve problems together!",
            venue: "Library Study Room 3",
            hostType: "STUDENT_GROUP",
            hostName: "CS Study Circle",
            startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5 hours later
            creatorId: adminUser.id
          },
          {
            title: "Book Exchange Fair",
            description: "Bring your old textbooks and exchange them for new ones! Great way to save money and help fellow students.",
            venue: "Student Center Plaza",
            hostType: "CLUB",
            hostName: "Student Welfare Club",
            startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
            endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
            creatorId: adminUser.id
          }
        ]
        
        await prisma.event.createMany({
          data: sampleEvents
        })
        
        console.log(`✅ Created ${sampleEvents.length} sample events`)
      }
    }
  }

  // Database health check
  console.log("🔍 Running database health check...")
  const stats = {
    categories: await prisma.category.count(),
    profiles: await prisma.profile.count(),
    listings: await prisma.listing.count(),
    transactions: await prisma.transaction.count(),
    events: await prisma.event.count(),
    admins: await prisma.profile.count({ where: { role: "ADMIN" } }),
    verified: await prisma.profile.count({ where: { verified: true } })
  }
  
  console.log("📊 Database Statistics:")
  console.log(`   Categories: ${stats.categories}`)
  console.log(`   Users: ${stats.profiles} (${stats.verified} verified, ${stats.admins} admins)`)
  console.log(`   Listings: ${stats.listings}`)
  console.log(`   Transactions: ${stats.transactions}`)
  console.log(`   Events: ${stats.events}`)

  console.log("🎉 Acadly database seed completed successfully!")
  console.log("")
  console.log("🚀 Next steps:")
  console.log("   1. Start the development server: npm run dev")
  console.log("   2. Visit http://localhost:3000")
  console.log("   3. Sign up with an admin email to get admin access")
  console.log("   4. Create your first listing!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
