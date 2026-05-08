-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- CreateEnum
CREATE TYPE "AllergyType" AS ENUM ('MEDICATION', 'FOOD', 'ENVIRONMENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING');

-- CreateEnum
CREATE TYPE "ConditionStatus" AS ENUM ('ACTIVE', 'MANAGED', 'IN_REMISSION', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ConditionSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "MedicationRoute" AS ENUM ('ORAL', 'INJECTION', 'TOPICAL', 'INHALATION', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicalHistoryEventType" AS ENUM ('SURGERY', 'HOSPITALIZATION', 'VACCINATION', 'INJURY', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_ALARM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nfc_tag_id" TEXT,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_information" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" DATE,
    "gender" "Gender",
    "blood_type" "BloodType",
    "identification_number" TEXT,
    "identification_type" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_profile" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "height_cm" DECIMAL(5,2),
    "weight_kg" DECIMAL(5,2),
    "organ_donor" BOOLEAN NOT NULL DEFAULT false,
    "insurance_provider" TEXT,
    "insurance_number" TEXT,
    "preferred_hospital" TEXT,
    "additional_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergies" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "allergen_name" TEXT NOT NULL,
    "allergy_type" "AllergyType" NOT NULL,
    "severity" "AllergySeverity" NOT NULL,
    "reaction_description" TEXT,
    "diagnosed_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronic_conditions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "condition_name" TEXT NOT NULL,
    "diagnosed_date" DATE,
    "severity" "ConditionSeverity",
    "status" "ConditionStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chronic_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_catalog" (
    "id" UUID NOT NULL,
    "generic_name" TEXT NOT NULL,
    "common_dosages" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_medications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "medication_id" UUID,
    "custom_medication_name" TEXT,
    "dosage" TEXT,
    "frequency" TEXT,
    "route" "MedicationRoute" NOT NULL DEFAULT 'ORAL',
    "prescribing_doctor" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "purpose" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone_primary" TEXT NOT NULL,
    "phone_secondary" TEXT,
    "email" TEXT,
    "priority_order" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type" "MedicalHistoryEventType" NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_date" DATE,
    "location" TEXT,
    "provider" TEXT,
    "outcome" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfc_scans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scan_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanner_ip" TEXT,
    "scanner_device_info" JSONB,
    "access_granted" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nfc_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_alerts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "alert_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "show_full_name" BOOLEAN NOT NULL DEFAULT true,
    "show_photo" BOOLEAN NOT NULL DEFAULT true,
    "show_age" BOOLEAN NOT NULL DEFAULT true,
    "show_blood_type" BOOLEAN NOT NULL DEFAULT true,
    "show_medical_history" BOOLEAN NOT NULL DEFAULT true,
    "show_medications" BOOLEAN NOT NULL DEFAULT true,
    "show_allergies" BOOLEAN NOT NULL DEFAULT true,
    "show_emergency_contacts" BOOLEAN NOT NULL DEFAULT true,
    "require_authentication" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nfc_tag_id_key" ON "users"("nfc_tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "personal_information_user_id_key" ON "personal_information"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "personal_information_identification_number_key" ON "personal_information"("identification_number");

-- CreateIndex
CREATE UNIQUE INDEX "medical_profile_user_id_key" ON "medical_profile"("user_id");

-- CreateIndex
CREATE INDEX "allergies_user_id_is_active_severity_idx" ON "allergies"("user_id", "is_active", "severity");

-- CreateIndex
CREATE INDEX "chronic_conditions_user_id_status_idx" ON "chronic_conditions"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "medication_catalog_generic_name_key" ON "medication_catalog"("generic_name");

-- CreateIndex
CREATE INDEX "medication_catalog_generic_name_idx" ON "medication_catalog"("generic_name");

-- CreateIndex
CREATE INDEX "user_medications_user_id_is_current_idx" ON "user_medications"("user_id", "is_current");

-- CreateIndex
CREATE INDEX "emergency_contacts_user_id_is_active_priority_order_idx" ON "emergency_contacts"("user_id", "is_active", "priority_order");

-- CreateIndex
CREATE INDEX "medical_history_user_id_event_type_idx" ON "medical_history"("user_id", "event_type");

-- CreateIndex
CREATE INDEX "nfc_scans_user_id_scan_timestamp_idx" ON "nfc_scans"("user_id", "scan_timestamp" DESC);

-- CreateIndex
CREATE INDEX "emergency_alerts_user_id_status_alert_timestamp_idx" ON "emergency_alerts"("user_id", "status", "alert_timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "privacy_settings_user_id_key" ON "privacy_settings"("user_id");

-- AddForeignKey
ALTER TABLE "personal_information" ADD CONSTRAINT "personal_information_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_profile" ADD CONSTRAINT "medical_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronic_conditions" ADD CONSTRAINT "chronic_conditions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_medications" ADD CONSTRAINT "user_medications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_medications" ADD CONSTRAINT "user_medications_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medication_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfc_scans" ADD CONSTRAINT "nfc_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_settings" ADD CONSTRAINT "privacy_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
