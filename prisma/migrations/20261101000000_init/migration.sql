-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "client_sex" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "experience_level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "client_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "program_status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "meal_plan_status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "check_in_status" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "schedule_event_type" AS ENUM ('CHECK_IN', 'COACHING_CALL', 'PROGRAM_REVIEW', 'NUTRITION_REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "schedule_event_status" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "adjustment_category" AS ENUM ('TRAINING', 'NUTRITION');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "date_of_birth" DATE,
    "sex" "client_sex",
    "height_cm" DECIMAL(6,2),
    "primary_goal" TEXT,
    "experience_level" "experience_level",
    "status" "client_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_programs" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "experience_level" "experience_level",
    "duration_weeks" INTEGER,
    "status" "program_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "training_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_days" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" UUID NOT NULL,
    "workout_day_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "rep_min" INTEGER NOT NULL,
    "rep_max" INTEGER NOT NULL,
    "rest_seconds" INTEGER,
    "target_weight_kg" DECIMAL(7,2),
    "instructions" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_assignments" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" DATE,
    "end_date" DATE,
    "status" "assignment_status" NOT NULL DEFAULT 'ACTIVE',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "program_snapshot" JSONB NOT NULL,

    CONSTRAINT "program_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_profiles" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "calorie_target" INTEGER NOT NULL,
    "protein_target" INTEGER NOT NULL,
    "carbs_target" INTEGER NOT NULL,
    "fat_target" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "nutrition_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_items" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "serving_label" TEXT NOT NULL,
    "serving_grams" DECIMAL(8,2),
    "calories_per_serving" INTEGER NOT NULL,
    "protein_g" DECIMAL(8,2) NOT NULL,
    "carbs_g" DECIMAL(8,2) NOT NULL,
    "fat_g" DECIMAL(8,2) NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "duration_weeks" INTEGER,
    "target_calories" INTEGER,
    "target_protein" INTEGER,
    "target_carbs" INTEGER,
    "target_fat" INTEGER,
    "status" "meal_plan_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" UUID NOT NULL,
    "meal_plan_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_foods" (
    "id" UUID NOT NULL,
    "meal_id" UUID NOT NULL,
    "food_item_id" UUID NOT NULL,
    "quantity" DECIMAL(8,3) NOT NULL,
    "food_name_snapshot" TEXT NOT NULL,
    "serving_label_snapshot" TEXT NOT NULL,
    "serving_grams_snapshot" DECIMAL(8,2),
    "calories_per_serving_snapshot" INTEGER NOT NULL,
    "protein_per_serving_snapshot" DECIMAL(8,2) NOT NULL,
    "carbs_per_serving_snapshot" DECIMAL(8,2) NOT NULL,
    "fat_per_serving_snapshot" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "meal_foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_assignments" (
    "id" UUID NOT NULL,
    "meal_plan_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "status" "assignment_status" NOT NULL DEFAULT 'ACTIVE',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "meal_plan_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_plan_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "recorded_at" TIMESTAMPTZ(3) NOT NULL,
    "weight_kg" DECIMAL(7,2),
    "body_fat_percent" DECIMAL(5,2),
    "muscle_mass_kg" DECIMAL(7,2),
    "chest_cm" DECIMAL(7,2),
    "waist_cm" DECIMAL(7,2),
    "hips_cm" DECIMAL(7,2),
    "arm_cm" DECIMAL(7,2),
    "thigh_cm" DECIMAL(7,2),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "measurement_id" UUID,
    "check_in_date" TIMESTAMPTZ(3) NOT NULL,
    "summary" TEXT,
    "status" "check_in_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_events" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "client_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "schedule_event_type" NOT NULL,
    "start_at" TIMESTAMPTZ(3) NOT NULL,
    "end_at" TIMESTAMPTZ(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" "schedule_event_status" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "schedule_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_rules" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_notes" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "coach_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_adjustments" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "category" "adjustment_category" NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "reason" TEXT,
    "previous_values" JSONB,
    "new_values" JSONB,
    "effective_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coaching_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "client_profiles_coach_id_status_idx" ON "client_profiles"("coach_id", "status");

-- CreateIndex
CREATE INDEX "client_profiles_coach_id_full_name_idx" ON "client_profiles"("coach_id", "full_name");

-- CreateIndex
CREATE INDEX "training_programs_coach_id_status_idx" ON "training_programs"("coach_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workout_days_program_id_sort_order_key" ON "workout_days"("program_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "workout_exercises_workout_day_id_sort_order_key" ON "workout_exercises"("workout_day_id", "sort_order");

-- CreateIndex
CREATE INDEX "program_assignments_client_id_status_idx" ON "program_assignments"("client_id", "status");

-- CreateIndex
CREATE INDEX "program_assignments_program_id_status_idx" ON "program_assignments"("program_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_profiles_client_id_key" ON "nutrition_profiles"("client_id");

-- CreateIndex
CREATE INDEX "food_items_coach_id_is_archived_idx" ON "food_items"("coach_id", "is_archived");

-- CreateIndex
CREATE INDEX "meal_plans_coach_id_status_idx" ON "meal_plans"("coach_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "meals_meal_plan_id_sort_order_key" ON "meals"("meal_plan_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "meal_foods_meal_id_food_item_id_key" ON "meal_foods"("meal_id", "food_item_id");

-- CreateIndex
CREATE INDEX "meal_plan_assignments_client_id_status_idx" ON "meal_plan_assignments"("client_id", "status");

-- CreateIndex
CREATE INDEX "meal_plan_assignments_meal_plan_id_status_idx" ON "meal_plan_assignments"("meal_plan_id", "status");

-- Enforce one primary active training assignment per client.
CREATE UNIQUE INDEX "program_assignment_one_primary_active_per_client"
ON "program_assignments"("client_id")
WHERE "is_primary" = true AND "status" = 'ACTIVE';

-- Enforce one primary active meal plan assignment per client.
CREATE UNIQUE INDEX "meal_plan_assignment_one_primary_active_per_client"
ON "meal_plan_assignments"("client_id")
WHERE "is_primary" = true AND "status" = 'ACTIVE';

-- CreateIndex
CREATE INDEX "measurements_client_id_recorded_at_idx" ON "measurements"("client_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_measurement_id_key" ON "check_ins"("measurement_id");

-- CreateIndex
CREATE INDEX "check_ins_client_id_check_in_date_idx" ON "check_ins"("client_id", "check_in_date");

-- CreateIndex
CREATE INDEX "schedule_events_coach_id_start_at_idx" ON "schedule_events"("coach_id", "start_at");

-- CreateIndex
CREATE INDEX "schedule_events_client_id_start_at_idx" ON "schedule_events"("client_id", "start_at");

-- CreateIndex
CREATE INDEX "availability_rules_coach_id_weekday_idx" ON "availability_rules"("coach_id", "weekday");

-- CreateIndex
CREATE INDEX "coach_notes_coach_id_client_id_created_at_idx" ON "coach_notes"("coach_id", "client_id", "created_at");

-- CreateIndex
CREATE INDEX "coaching_adjustments_coach_id_client_id_effective_at_idx" ON "coaching_adjustments"("coach_id", "client_id", "effective_at");

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "training_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_assignments" ADD CONSTRAINT "program_assignments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "training_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_assignments" ADD CONSTRAINT "program_assignments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_profiles" ADD CONSTRAINT "nutrition_profiles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_meal_plan_id_fkey" FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "food_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_assignments" ADD CONSTRAINT "meal_plan_assignments_meal_plan_id_fkey" FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_assignments" ADD CONSTRAINT "meal_plan_assignments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_measurement_id_fkey" FOREIGN KEY ("measurement_id") REFERENCES "measurements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_adjustments" ADD CONSTRAINT "coaching_adjustments_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_adjustments" ADD CONSTRAINT "coaching_adjustments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
