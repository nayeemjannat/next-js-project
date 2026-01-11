-- CreateTable
CREATE TABLE "service_bids" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "serviceCategory" TEXT NOT NULL,
    "description" TEXT,
    "budgetMin" REAL,
    "budgetMax" REAL,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_bids_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "provider_bids" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceBidId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "message" TEXT,
    "estimatedTime" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_bids_serviceBidId_fkey" FOREIGN KEY ("serviceBidId") REFERENCES "service_bids" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_bids_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
