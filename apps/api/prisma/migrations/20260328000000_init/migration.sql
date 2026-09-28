-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('reporter', 'admin');

-- CreateEnum
CREATE TYPE "ExternalSyncStatus" AS ENUM ('none', 'pending', 'synced', 'error');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'reporter',
    "google_sub" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "report_datetime" TIMESTAMP(3) NOT NULL,
    "detected_datetime" TIMESTAMP(3),
    "occurred_datetime" TIMESTAMP(3),
    "affected_systems" TEXT,
    "affected_users" TEXT,
    "potential_data" TEXT,
    "observed_activity" TEXT,
    "evidence_notes" TEXT,
    "actions_taken" TEXT,
    "current_impact" TEXT,
    "other_info" TEXT,
    "reporting_channel" TEXT,
    "incident_type" TEXT,
    "severity" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "assigned_owner_email" TEXT,
    "admin_notes" TEXT,
    "detection_source" TEXT,
    "timeline_summary" TEXT,
    "containment_actions" TEXT,
    "eradication_actions" TEXT,
    "recovery_actions" TEXT,
    "root_cause" TEXT,
    "impact_assessment" TEXT,
    "notifications_made" TEXT,
    "related_tickets" TEXT,
    "related_runbooks" TEXT,
    "risk_acceptance_ref" TEXT,
    "closure_date" TIMESTAMP(3),
    "postmortem_ref" TEXT,
    "external_ticket_id" TEXT,
    "external_ticket_url" TEXT,
    "external_sync_status" "ExternalSyncStatus" NOT NULL DEFAULT 'none',
    "external_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_files" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_id_counters" (
    "year" INTEGER NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "incident_id_counters_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_incident_id_key" ON "incidents"("incident_id");

-- CreateIndex
CREATE INDEX "incidents_external_ticket_id_idx" ON "incidents"("external_ticket_id");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_created_at_idx" ON "incidents"("created_at");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

