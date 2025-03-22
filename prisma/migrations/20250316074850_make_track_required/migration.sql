-- Backfill 'track' with 'trackId' data where 'track' is NULL
UPDATE "Like" 
SET "track" = jsonb_build_object('trackId', "trackId", 'title', 'Unknown Title', 'artist', 'Unknown Artist', 'source', 'unknown')
WHERE "track" IS NULL AND "trackId" IS NOT NULL;

-- Make 'track' required
ALTER TABLE "Like" 
ALTER COLUMN "track" SET NOT NULL;

-- Drop 'trackId' column
ALTER TABLE "Like" 
DROP COLUMN "trackId";