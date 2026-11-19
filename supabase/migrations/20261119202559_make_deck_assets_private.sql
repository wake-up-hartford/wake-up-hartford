-- The live Lovable site has the deck-assets bucket set to private, but
-- migration 20260531193949 made it public. Match the live setting.
UPDATE storage.buckets SET public = false WHERE id = 'deck-assets';
