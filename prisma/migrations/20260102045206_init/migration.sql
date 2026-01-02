-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "name" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "deliveryTime" TEXT NOT NULL DEFAULT '08:00',
    "bibleVersion" TEXT NOT NULL DEFAULT 'KJV',
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'inactive',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "trialStartDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VerseLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "verseRef" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    CONSTRAINT "VerseLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
