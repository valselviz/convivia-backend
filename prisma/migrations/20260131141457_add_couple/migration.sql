-- CreateTable
CREATE TABLE "Couple" (
    "id" SERIAL NOT NULL,
    "bride_name" VARCHAR(100) NOT NULL,
    "groom_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);
