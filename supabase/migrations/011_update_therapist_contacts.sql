-- Migration 011: Update therapist WhatsApp numbers and emails
-- Only updates whatsapp_number and email fields; does not modify any other columns.

UPDATE therapists SET whatsapp_number = '+919167114754', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Aekta Brahmbhatt');

UPDATE therapists SET whatsapp_number = '+919385960024', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Sharmee M Divan');

UPDATE therapists SET whatsapp_number = '+919640000054', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Dr. P T Sunderam');

UPDATE therapists SET whatsapp_number = '+919381053134', email = 'network@4swithin.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Hemalatha Swaminathan');

UPDATE therapists SET whatsapp_number = '+919820834868', email = 'projectaverti@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Niyatii N Shah');

UPDATE therapists SET whatsapp_number = '+919819901581', email = 'milaapcounseling@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Suvarna Varde');

UPDATE therapists SET whatsapp_number = '+919886381571', email = 'sudeeptha@thecoffeeshopcounsellor.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Sudeeptha Grama');

UPDATE therapists SET whatsapp_number = '+917339336844', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Anisha Rafi');

UPDATE therapists SET whatsapp_number = '+919561823601', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Snehal Chhajed');

UPDATE therapists SET whatsapp_number = '+916260474014', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Ashutosh Tiwari');

UPDATE therapists SET whatsapp_number = '+919971842641', email = 'info@sanakhullar.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Sana Khullar');

UPDATE therapists SET whatsapp_number = '+919899981217', email = 'therapistpreetisomani@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Preeti Somani');

UPDATE therapists SET whatsapp_number = '+919583013425', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Mahi Modi');

UPDATE therapists SET whatsapp_number = '+918287416458', email = 'kaur.gunjan02@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Gunjan Kaur Kukreja');

UPDATE therapists SET whatsapp_number = '+919849494250', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Amjad Ali Mohammad');

UPDATE therapists SET whatsapp_number = '+919003681043', email = 'lalitharagul88@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Lalitha Ragul');

UPDATE therapists SET whatsapp_number = '+919003283342', email = 'ml.vedha@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Muthulakshmi Balasubramanian');

UPDATE therapists SET whatsapp_number = '+917042989385', email = 'shruti.dramatherapy@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Shruti Garg');

UPDATE therapists SET whatsapp_number = '+917303915633', email = 'ksanghavi2910@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Khushboo Sanghavi');

UPDATE therapists SET whatsapp_number = '+917397224080', email = 'joshitha.cheppalli.98@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Joshitha Cheppalli');

UPDATE therapists SET whatsapp_number = '+918732903167', email = 'psychologistdimple@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Dimple Jain');

UPDATE therapists SET whatsapp_number = '+917373740350', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Janani K');

UPDATE therapists SET whatsapp_number = '+918369612840', email = 'rizun.sharma@gmail.com', updated_at = NOW()
WHERE LOWER(full_name) = LOWER('Rizun Sharma');
