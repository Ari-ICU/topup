-- AlterTable
ALTER TABLE "GlobalStock" ADD COLUMN     "providerBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalTransferredRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0;
