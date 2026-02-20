
-- ===============================================================
-- SQL HELPERS FOR MANUAL CLIENT CLEANUP
-- Run these in the Supabase SQL Editor if needed to resolve sync issues.
-- ===============================================================

-- 1. DELETE SPECIFIC CLIENT BY ID
-- Replace 'CLIENT_ID_HERE' with the actual UUID of the client
-- DELETE FROM public.clients WHERE id = 'CLIENT_ID_HERE';

-- 2. FORCE DELETE ALL CLIENTS ON A SPECIFIC PCO
-- Replace 'PCO_ID_HERE' with the Equipment UUID of the PCO
-- DELETE FROM public.clients WHERE equipment_id = 'PCO_ID_HERE';

-- 3. CHECK FOR ORPHANED CLIENTS (Integrity Check)
-- Finds clients that point to an equipment ID that no longer exists
SELECT c.id, c.name, c.login, c.equipment_id 
FROM public.clients c
LEFT JOIN public.equipments e ON c.equipment_id = e.id
WHERE e.id IS NULL;

-- 4. DELETE ORPHANED CLIENTS
-- Safe cleanup of bad references
DELETE FROM public.clients 
WHERE id IN (
    SELECT c.id FROM public.clients c
    LEFT JOIN public.equipments e ON c.equipment_id = e.id
    WHERE e.id IS NULL
);

-- 5. RESET PCO PORT STATUS IF UNSYNCED (Advanced)
-- If a PCO thinks a port is USED but no client exists in DB for that port
-- This is a complex query, usually better handled by the application logic re-saving the PCO.
