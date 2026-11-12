import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const guests = [
  { full_name: "Valeria", host_name: "Host A", notes: "Familia" },
  { full_name: "Mami", host_name: "Host A", notes: "Familia" },
  { full_name: "Jessica", host_name: "Host A", notes: "Familia" },
  { full_name: "Carla", host_name: "Host A", notes: "Familia" },
  { full_name: "Dubra", host_name: "Host A", notes: "Familia" },
  { full_name: "William", host_name: "Host A", notes: "Familia" },
  { full_name: "Anny", host_name: "Host A", notes: "Familia" },
  { full_name: "Hendrix", host_name: "Host A", notes: "Familia" },
  { full_name: "Ninoska", host_name: "Host A", notes: "Familia" },
  { full_name: "Genesis", host_name: "Host A", notes: "Familia" },
  { full_name: "Caro", host_name: "Host A", notes: "Amigos" },
  { full_name: "Diana", host_name: "Host A", notes: "Amigos" },
  { full_name: "Camilo", host_name: "Host A", notes: "Amigos" },
  { full_name: "Miguely", host_name: "Host A", notes: "Amigos" },
  { full_name: "Lilia", host_name: "Host A", notes: "Amigos" },
  { full_name: "Zoraida", host_name: "Host A", notes: "Amigos" },
  { full_name: "Olga", host_name: "Host A", notes: "Amigos" },
  { full_name: "Astrid", host_name: "Host A", notes: "Amigos" },
  { full_name: "Patricia", host_name: "Host A", notes: "Amigos" },
  { full_name: "Oriana", host_name: "Host A", notes: "Amigos" },
  { full_name: "Diego", host_name: "Host A", notes: "Amigos" },
  { full_name: "Jhohandersonsito", host_name: "Host A", notes: "Amigos" },
  { full_name: "Liliana", host_name: "Host A", notes: "Amigos" },
  { full_name: "Dilia", host_name: "Host A", notes: "Amigos" },
];

async function main() {
  console.log("Clearing existing data...");
  await prisma.tableAssignment.deleteMany({});
  await prisma.guestGroupMember.deleteMany({});
  await prisma.guestRelation.deleteMany({});
  await prisma.guest.deleteMany({});
  await prisma.guestGroup.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.host.deleteMany({});
  await prisma.event.deleteMany({});

  const event = await prisma.event.create({
    data: { name: "Mi primer evento" },
  });
  console.log(`Created event #${event.id}: ${event.name}`);

  const hostNames = Array.from(
    new Set(
      guests
        .map((g) => g.host_name)
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0),
    ),
  );

  console.log(`Creating ${hostNames.length} hosts...`);
  for (const name of hostNames) {
    await prisma.host.create({
      data: { event_id: event.id, name },
    });
  }

  const hostRecords = await prisma.host.findMany({
    where: { event_id: event.id, name: { in: hostNames } },
    select: { id: true, name: true },
  });
  const hostIdByName = new Map(hostRecords.map((h) => [h.name, h.id]));

  console.log(`Inserting ${guests.length} guests...`);
  for (const g of guests) {
    const hostName = g.host_name;
    const host_id = hostName ? (hostIdByName.get(hostName) ?? null) : null;

    await prisma.guest.create({
      data: {
        event_id: event.id,
        full_name: g.full_name,
        guest_type: "MAIN_GUEST",
        host_name: g.host_name,
        host_id,
        gender: "FEMALE",
        age_range: "ADULT",
        notes: g.notes,
        status: "INVITED",
      },
    });
  }

  console.log(`✓ ${guests.length} guests inserted successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
