import { PrismaClient } from './src/generated/client/index.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Usuarios ===");
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users, null, 2));

  console.log("\n=== Información Personal ===");
  const personal = await prisma.personalInformation.findMany();
  console.log(JSON.stringify(personal, null, 2));

  console.log("\n=== Alergias ===");
  const allergies = await prisma.allergy.findMany();
  console.log(JSON.stringify(allergies, null, 2));

  console.log("\n=== Condiciones Crónicas ===");
  const conditions = await prisma.chronicCondition.findMany();
  console.log(JSON.stringify(conditions, null, 2));

  console.log("\n=== Medicamentos del Usuario ===");
  const medications = await prisma.userMedication.findMany();
  console.log(JSON.stringify(medications, null, 2));

  console.log("\n=== Historial Clínico ===");
  const history = await prisma.medicalHistory.findMany();
  console.log(JSON.stringify(history, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
