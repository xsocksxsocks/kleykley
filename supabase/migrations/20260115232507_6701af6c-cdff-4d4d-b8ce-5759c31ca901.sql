-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Rename order status enum values to reflect "Anfrage" instead of "Bestellung"
-- Note: We'll keep the database structure but update the display in the frontend

-- Schedule auto-approval job every 3 hours between 8-20 Uhr (Berlin time)
-- Runs at 8:00, 11:00, 14:00, 17:00, 20:00
SELECT cron.schedule(
    'process-auto-approvals',
    '0 8,11,14,17,20 * * *',
    $$
    SELECT net.http_post(
        url := 'https://elrxbgberccgztipwtcw.supabase.co/functions/v1/process-auto-approvals',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscnhiZ2JlcmNjZ3p0aXB3dGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTAzMDIsImV4cCI6MjA4NDA4NjMwMn0.XTYFj1ZhX9iy7bckocfaXXDr7n7Q4OYd_WVrFXFd_S8"}'::jsonb,
        body := '{}'::jsonb
    ) AS request_id;
    $$
);