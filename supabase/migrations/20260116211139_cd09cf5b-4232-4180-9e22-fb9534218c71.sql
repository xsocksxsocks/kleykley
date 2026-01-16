-- Drop the user_documents table
DROP TABLE IF EXISTS public.user_documents;

-- Delete the user-documents storage bucket
DELETE FROM storage.buckets WHERE id = 'user-documents';