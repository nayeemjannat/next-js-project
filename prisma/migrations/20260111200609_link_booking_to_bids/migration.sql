-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledDate" DATETIME NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "notes" TEXT,
    "providerBidId" TEXT,
    "serviceBidId" TEXT,
    "price" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_providerBidId_fkey" FOREIGN KEY ("providerBidId") REFERENCES "provider_bids" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_serviceBidId_fkey" FOREIGN KEY ("serviceBidId") REFERENCES "service_bids" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("address", "city", "completedAt", "createdAt", "customerId", "id", "notes", "paymentMethod", "paymentStatus", "price", "providerId", "scheduledDate", "scheduledTime", "serviceId", "state", "status", "updatedAt", "zipCode") SELECT "address", "city", "completedAt", "createdAt", "customerId", "id", "notes", "paymentMethod", "paymentStatus", "price", "providerId", "scheduledDate", "scheduledTime", "serviceId", "state", "status", "updatedAt", "zipCode" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE UNIQUE INDEX "bookings_providerBidId_key" ON "bookings"("providerBidId");
CREATE UNIQUE INDEX "bookings_serviceBidId_key" ON "bookings"("serviceBidId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
