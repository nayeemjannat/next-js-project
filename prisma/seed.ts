import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../lib/auth-utils"

const prisma = new PrismaClient()

async function main() {
  const adminEmail = "admin@homease.com"
  const adminPassword = "admin123"
  const adminName = "Admin User"

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log("Admin user already exists!")
    return
  }

  // Hash password
  const hashedPassword = await hashPassword(adminPassword)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      userType: "admin",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(adminName)}`,
    },
  })

  console.log("✅ Admin user created successfully!")
  console.log(`Email: ${adminEmail}`)
  console.log(`Password: ${adminPassword}`)
  console.log("\n⚠️  Please change the password after first login!")
}

main()
  .catch((e) => {
    console.error("Error creating admin user:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

