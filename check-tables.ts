import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkTables() {
  try {
    console.log("\n📊 Checking Database Tables\n")
    console.log("=".repeat(60))

    // Check if we can query each table
    const userCount = await prisma.user.count()
    console.log(`✅ Users table exists - ${userCount} records`)

    const serviceCount = await prisma.service.count()
    console.log(`✅ Services table exists - ${serviceCount} records`)

    const bookingCount = await prisma.booking.count()
    console.log(`✅ Bookings table exists - ${bookingCount} records`)

    console.log("\n" + "=".repeat(60))
    console.log("✅ All tables are present in the database!")
    console.log("\nTables:")
    console.log("  - users (existing)")
    console.log("  - services (NEW)")
    console.log("  - bookings (NEW)")
  } catch (error: any) {
    if (error.code === "P2021" || error.message?.includes("does not exist")) {
      console.error("❌ Error: Tables not found. Migration may not have been applied.")
      console.error("Run: npm run db:migrate")
    } else {
      console.error("❌ Error:", error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()

