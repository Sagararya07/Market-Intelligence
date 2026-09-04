import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@marketintelligence.com"; // CHANGE THIS EMAIL
  const password = "Password123!"; // CHANGE THIS PASSWORD

  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("No organization found. Please run the seed script first.");
    return;
  }

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      firstName: "New",
      lastName: "Admin",
      email: email,
      passwordHash: hash,
      role: "ADMIN"
    }
  });

  console.log("-----------------------------------------");
  console.log("SUCCESS! New user created.");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("-----------------------------------------");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
