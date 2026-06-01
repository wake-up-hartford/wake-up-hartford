-- Lock down deck-assets storage bucket: it is unused by the app, so deny all client-side writes/reads.
-- Service role (server-side admin client) bypasses RLS and retains full access.

CREATE POLICY "deck-assets: deny anon select"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id <> 'deck-assets');

CREATE POLICY "deck-assets: deny authenticated select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id <> 'deck-assets');

CREATE POLICY "deck-assets: deny anon insert"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id <> 'deck-assets');

CREATE POLICY "deck-assets: deny authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id <> 'deck-assets');

CREATE POLICY "deck-assets: deny anon update"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id <> 'deck-assets')
WITH CHECK (bucket_id <> 'deck-assets');

CREATE POLICY "deck-assets: deny authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id <> 'deck-assets')
WITH CHECK (bucket_id <> 'deck-assets');

CREATE POLICY "deck-assets: deny anon delete"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id <> 'deck-assets');

CREATE POLICY "deck-assets: deny authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id <> 'deck-assets');