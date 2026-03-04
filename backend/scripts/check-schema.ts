import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
console.log("Package fields in Client:", Object.keys((prisma as any).package.fields || {}));
await prisma.$disconnect();
