import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function viewDatabase() {
  try {
    console.log("\n📊 Database Contents\n")
    console.log("=".repeat(60))
    
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    })

    if (users.length === 0) {
      console.log("\n❌ No users found in the database.")
      console.log("💡 Try registering a user at http://localhost:3000/auth/register\n")
    } else {
      console.log(`\n✅ Found ${users.length} user(s) in the database:\n`)
      
      users.forEach((user, index) => {
        console.log(`\n👤 User #${index + 1}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Type: ${user.userType}`)
        console.log(`   Verified: ${user.isVerified ? "✅ Yes" : "❌ No"}`)
        console.log(`   Verification Status: ${user.verificationStatus || "N/A"}`)
        console.log(`   Phone: ${user.phone || "N/A"}`)
        console.log(`   Created: ${user.createdAt.toLocaleString()}`)
        console.log(`   Updated: ${user.updatedAt.toLocaleString()}`)
        console.log("-".repeat(60))
      })
    }
  } catch (error) {
    console.error("❌ Error viewing database:", error)
  } finally {
    await prisma.$disconnect()
  }
}

viewDatabase()

