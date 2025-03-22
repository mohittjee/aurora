-- AlterTable
ALTER TABLE "Like" ADD COLUMN     "track" JSONB,
ALTER COLUMN "trackId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "link" TEXT;
