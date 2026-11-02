-- ====================================================================
-- MediQ PostgreSQL Demo Seed Data
-- Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
-- ====================================================================

-- 1. Insert Demo Hospitals
INSERT INTO hospitals (id, name, license_number, city, state, pincode, is_active)
VALUES
    ('hosp_civil_ahd', 'Civil Hospital Ahmedabad', 'GJ-AH-MED-10192', 'Ahmedabad', 'Gujarat', '380016', TRUE),
    ('hosp_silver_oak', 'Silver Oak University Healthcare Center', 'GJ-AH-MED-44910', 'Ahmedabad', 'Gujarat', '382481', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Demo Doctors
INSERT INTO doctors (id, hospital_id, full_name, nmc_registration_number, specialization, daily_capacity, status)
VALUES
    ('doc_patel_cardio', 'hosp_silver_oak', 'Dr. Rajesh Patel', 'GMC-48912', 'Cardiology', 50, 'ACTIVE'),
    ('doc_mehta_pedia', 'hosp_civil_ahd', 'Dr. Ananya Mehta', 'GMC-55104', 'Pediatrics', 60, 'ACTIVE'),
    ('doc_sharma_ortho', 'hosp_silver_oak', 'Dr. Vikram Sharma', 'GMC-39182', 'Orthopedics', 40, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Demo Patients
INSERT INTO patients (id, abha_address, full_name, phone_number, gender, date_of_birth)
VALUES
    ('b3e2a104-5832-4e91-8dc9-1d1847e9281a', 'rahul.verma@abdm', 'Rahul Verma', '+919876543210', 'male', '1998-05-14'),
    ('c5f4b215-6943-4f02-9ed0-2e2958f0392b', 'priya.sharma@abdm', 'Priya Sharma', '+919812345678', 'female', '2001-11-22')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Demo OPD Queue Tokens
INSERT INTO opd_tokens (doctor_id, patient_id, token_number, token_code, priority_lane, status, appointment_date)
VALUES
    ('doc_patel_cardio', 'b3e2a104-5832-4e91-8dc9-1d1847e9281a', 1, 'T-001', 'NORMAL', 'COMPLETED', CURRENT_DATE),
    ('doc_patel_cardio', 'c5f4b215-6943-4f02-9ed0-2e2958f0392b', 2, 'T-002', 'NORMAL', 'IN_PROGRESS', CURRENT_DATE)
ON CONFLICT DO NOTHING;
