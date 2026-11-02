-- ====================================================================
-- MediQ PostgreSQL Relational EMR, ABDM & Financial Settlement Schema
-- Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Hospitals Registry
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(128) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Ahmedabad',
    state VARCHAR(100) NOT NULL DEFAULT 'Gujarat',
    pincode VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Registered Doctors & Medical Council Accreditation
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) REFERENCES hospitals(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    nmc_registration_number VARCHAR(128) UNIQUE NOT NULL,
    specialization VARCHAR(128) NOT NULL,
    daily_capacity INT NOT NULL DEFAULT 60 CHECK (daily_capacity > 0),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Patients & Ayushman Bharat (ABHA) Profiles
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    abha_address VARCHAR(128) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    gender VARCHAR(16) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. OPD Appointment Tokens & Queue Pacing
CREATE TABLE IF NOT EXISTS opd_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE RESTRICT,
    patient_id UUID REFERENCES patients(id) ON DELETE RESTRICT,
    token_number INT NOT NULL,
    token_code VARCHAR(32) NOT NULL,
    priority_lane VARCHAR(32) NOT NULL DEFAULT 'NORMAL' CHECK (priority_lane IN ('NORMAL', 'EMERGENCY', 'SENIOR', 'PREGNANT', 'DISABLED')),
    status VARCHAR(32) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, appointment_date, token_number)
);

-- 5. Pharmacy Orders & Jan Aushadhi Generic Savings
CREATE TABLE IF NOT EXISTS pharmacy_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE RESTRICT,
    total_mrp NUMERIC(10, 2) NOT NULL CHECK (total_mrp >= 0),
    jan_aushadhi_price NUMERIC(10, 2) NOT NULL CHECK (jan_aushadhi_price >= 0),
    patient_savings NUMERIC(10, 2) NOT NULL CHECK (patient_savings >= 0),
    delivery_mode VARCHAR(32) NOT NULL DEFAULT 'EXPRESS_RIDER' CHECK (delivery_mode IN ('COUNTER_PICKUP', 'EXPRESS_RIDER')),
    order_status VARCHAR(32) NOT NULL DEFAULT 'PLACED' CHECK (order_status IN ('PLACED', 'DISPENSED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Double-Entry Accounting Settlement Ledger (Banking Compliance)
CREATE TABLE IF NOT EXISTS double_entry_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref VARCHAR(128) NOT NULL,
    debit_account VARCHAR(64) NOT NULL,
    credit_account VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for High-Frequency OPD Queue Queries
CREATE INDEX IF NOT EXISTS idx_opd_doctor_status ON opd_tokens(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number);
CREATE INDEX IF NOT EXISTS idx_orders_patient ON pharmacy_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tx ON double_entry_ledger(transaction_ref);
