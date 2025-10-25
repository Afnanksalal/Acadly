const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create categories
  const categories = [
    { name: "Textbooks" },
    { name: "Calculators" },
    { name: "Electronics" },
    { name: "Furniture" },
    { name: "Lab Equipment" },
    { name: "Stationery" },
    { name: "Sports & Fitness" },
    { name: "Clothing" },
    { name: "Lab Assistance" },
    { name: "Project Support" },
    { name: "Record Writing" },
    { name: "Tutoring" },
  ]

  const createdCategories = await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  })
  console.log(`✅ Created ${categories.length} categories`)

  // Elevate admin if profile already exists (after first login)
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  
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

  console.log("🎉 Database seed completed!")
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
