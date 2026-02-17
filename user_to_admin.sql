-- Promote user to Admin role
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id = '';


-- Update WideSpectrum rows to match their actual profile info
UPDATE "public"."Drugs" 
SET 
  wholesaler_name = 'AIVEEN WHOLESALE PHARMACY', -- Match the name in metadata
  city = 'Mbarara',                -- Match the city in metadata
  contact_method = '0710101000'    -- Match the phone in metadata
WHERE user_id = '6f3d2524-df9d-4c95-abf6-c7a4b0a2deb7';


 "city": "Mbarara",
    "role": "supplier",
    "email": "aiveen@gmail.com",
    "status": "approved",
    "phone_number": "0710101000",
    "business_name": "AIVEEN WHOLESALE PHARMACY",

-- Repeat this logic for Spring and Aiveen with their correct metadata