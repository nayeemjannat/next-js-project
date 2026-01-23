-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "userType" TEXT NOT NULL,
    "avatar" TEXT,
    "phone" TEXT,
    "provider" TEXT,
    "providerId" TEXT,
    "authMethod" TEXT DEFAULT 'email',
    "hasPassword" BOOLEAN NOT NULL DEFAULT false,
    "googleId" TEXT,
    "sessionToken" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT,
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "rejectionReason" TEXT,
    "bio" TEXT,
    "experience" INTEGER,
    "location" TEXT,
    "specialties" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatar", "bio", "createdAt", "email", "emailVerified", "experience", "id", "isVerified", "location", "name", "password", "phone", "provider", "providerId", "rejectionReason", "sessionToken", "specialties", "updatedAt", "userType", "verificationStatus", "verifiedAt", "verifiedBy") SELECT "avatar", "bio", "createdAt", "email", "emailVerified", "experience", "id", "isVerified", "location", "name", "password", "phone", "provider", "providerId", "rejectionReason", "sessionToken", "specialties", "updatedAt", "userType", "verificationStatus", "verifiedAt", "verifiedBy" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_sessionToken_key" ON "users"("sessionToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
