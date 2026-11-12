-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "GuestType" AS ENUM ('MAIN_GUEST', 'PLUS_ONE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "AgeRange" AS ENUM ('ADULT', 'CHILD', 'BABY');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('INVITED', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "Shape" AS ENUM ('redonda', 'rectangular');

-- CreateEnum
CREATE TYPE "GuestRelationKind" AS ENUM ('AFFINITY', 'FAMILY', 'SOCIAL', 'CONFLICT');

-- CreateEnum
CREATE TYPE "GuestRelationSource" AS ENUM ('USER', 'IMPORT', 'AI_SUGGESTION');

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "guest_type" "GuestType" NOT NULL,
    "main_guest_id" INTEGER,
    "host_name" VARCHAR(100),
    "host_id" INTEGER,
    "gender" "Gender" NOT NULL,
    "age_range" "AgeRange" NOT NULL DEFAULT 'ADULT',
    "avatar_key" VARCHAR(50),
    "notes" TEXT,
    "status" "Status" NOT NULL DEFAULT 'INVITED',

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestGroup" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50),

    CONSTRAINT "GuestGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestGroupMember" (
    "id" SERIAL NOT NULL,
    "guest_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "GuestGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestRelation" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "guest_a_id" INTEGER NOT NULL,
    "guest_b_id" INTEGER NOT NULL,
    "kind" "GuestRelationKind" NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 3,
    "source" "GuestRelationSource" NOT NULL DEFAULT 'USER',
    "notes" VARCHAR(500),

    CONSTRAINT "GuestRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "shape" "Shape",
    "seats" INTEGER NOT NULL,
    "category" VARCHAR(50),

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableAssignment" (
    "id" SERIAL NOT NULL,
    "table_id" INTEGER NOT NULL,
    "guest_id" INTEGER NOT NULL,
    "seat_number" INTEGER,

    CONSTRAINT "TableAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Host" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Host_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Guest_event_id_idx" ON "Guest"("event_id");

-- CreateIndex
CREATE INDEX "GuestGroup_event_id_idx" ON "GuestGroup"("event_id");

-- CreateIndex
CREATE INDEX "GuestRelation_event_id_idx" ON "GuestRelation"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "GuestRelation_guest_a_id_guest_b_id_kind_key" ON "GuestRelation"("guest_a_id", "guest_b_id", "kind");

-- CreateIndex
CREATE INDEX "Table_event_id_idx" ON "Table"("event_id");

-- CreateIndex
CREATE INDEX "Host_event_id_idx" ON "Host"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "Host_event_id_name_key" ON "Host"("event_id", "name");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_main_guest_id_fkey" FOREIGN KEY ("main_guest_id") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "Host"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GuestGroup" ADD CONSTRAINT "GuestGroup_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GuestGroupMember" ADD CONSTRAINT "GuestGroupMember_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GuestGroupMember" ADD CONSTRAINT "GuestGroupMember_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "GuestGroup"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GuestRelation" ADD CONSTRAINT "GuestRelation_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GuestRelation" ADD CONSTRAINT "GuestRelation_guest_a_id_fkey" FOREIGN KEY ("guest_a_id") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GuestRelation" ADD CONSTRAINT "GuestRelation_guest_b_id_fkey" FOREIGN KEY ("guest_b_id") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

