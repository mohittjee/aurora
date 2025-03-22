-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "googleId" TEXT,
    "password" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tracks" JSONB NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
