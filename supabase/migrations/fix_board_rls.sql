-- ============================================================
-- Fix RLS Policies for Bulletin Board (posts table)
-- Problem: Only authors could update posts, preventing others
--          from adding reactions (Acknowledgement / Completion).
-- Solution: Allow all authenticated users to update posts.
-- ============================================================

-- Existing restrictive policy
DROP POLICY IF EXISTS "Users can update own posts" ON posts;

-- Allow authenticated users to update posts
-- (This enables users to update the 'reactions' and 'favorites' columns)
CREATE POLICY "Authenticated users can update posts" ON posts
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Also ensure DELETE is still restricted to the author
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Authors can delete own posts" ON posts
    FOR DELETE USING (
        auth.uid() = author_id
    );
