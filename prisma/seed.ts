import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const guests = [
  // Novia - Familia
  { full_name: "Valeria", side: "BRIDE" as const, notes: "Familia" },
  { full_name: "Mami", side: "BRIDE" as const, notes: "Familia" },
  { full_name: "Jessica", side: "BRIDE" as const, notes: "Familia" },
  { full_name: "Carla", side: "BRIDE" as const, notes: "Familia" },
  { full_name: "Dubra", side: "BRIDE" as const, notes: "Familia" },
  { full_name: "William", side: "BRIDE" as const, notes: "Familia" },
  { full_name: "Anny", side: "BRIDE" as const, notes: "Familia" },
  { full_name: "Hendrix", side: "BRIDE" as const, notes: "Familia" },
  { full_name: "Ninoska", side: "BRIDE" as const, notes: "Familia" },
  { full_name: "Genesis", side: "BRIDE" as const, notes: "Familia" },
  // Novia - Amigos
  { full_name: "Caro", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Diana", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Camilo", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Miguely", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Lilia", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Zoraida", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Olga", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Astrid", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Patricia", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Oriana", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Diego", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Jhohandersonsito", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Liliana", side: "BRIDE" as const, notes: "Amigos" },
  { full_name: "Dilia", side: "BRIDE" as const, notes: "Amigos" },
  // Novio - Familia
  { full_name: "Alfonso", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Elena", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Andrés", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Matías", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Irai", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Mauricio", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Lucía", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Rodrigo", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Lucha", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Maria Delia", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Vicky", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Marcelo", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Santiago", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Ana Inés", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Joaquín", side: "GROOM" as const, notes: "Familia" },
  { full_name: "Choli", side: "GROOM" as const, notes: "Familia" },
  {
    full_name: "Francisco (hno. de Ana)",
    side: "GROOM" as const,
    notes: "Familia",
  },
  // Novio - Amigos
  { full_name: "Rodrigo", side: "GROOM" as const, notes: "Amigos" },
  { full_name: "Diego", side: "GROOM" as const, notes: "Amigos" },
  { full_name: "Nico", side: "GROOM" as const, notes: "Amigos" },
];

async function main() {
  console.log("Borrando invitados existentes...");
  await prisma.guest.deleteMany({});

  console.log(`Insertando ${guests.length} invitados...`);
  for (const g of guests) {
    await prisma.guest.create({
      data: {
        full_name: g.full_name,
        guest_type: "MAIN_GUEST",
        side: g.side,
        age_range: "ADULT",
        notes: g.notes,
        status: "INVITED",
      },
    });
  }

  console.log(`✓ ${guests.length} invitados insertados correctamente.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
