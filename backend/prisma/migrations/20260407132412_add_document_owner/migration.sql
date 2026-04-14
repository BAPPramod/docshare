-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "documents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" INTEGER NOT NULL,
    CONSTRAINT "documents_ownerId_fkey" FOREIGN KEY ("ownerId") 
    REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_shares" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "document_shares_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "document_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "audit_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "document_shares_documentId_userId_key" ON "document_shares"("documentId", "userId");
