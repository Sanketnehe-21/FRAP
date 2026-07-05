-- Deduplicate family_members (keep earliest entry per user)
DELETE FROM family_members a USING family_members b
WHERE a.joined_at > b.joined_at AND a.user_id = b.user_id;

-- Add UNIQUE constraint on user_id to enforce "One user belongs to one family only"
ALTER TABLE family_members ADD CONSTRAINT unique_family_members_user_id UNIQUE (user_id);
