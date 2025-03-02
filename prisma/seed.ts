import { PrismaClient, Role, ParkingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  //delete all data
  await prisma.reservations.deleteMany();
  await prisma.cars.deleteMany();
  await prisma.parking_slots.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.users.deleteMany();

  // Mock Users
  const users_create = await prisma.users.createMany({
    data: [
      {
        email: 'alice@example.com',
        name: 'Alice',
        password: 'password',
        image_url: '',
        role: Role.USER,
      },
      {
        email: 'bob@example.com',
        name: 'Bob',
        password: 'password',
        image_url: '',
        role: Role.USER,
      },
      {
        email: 'carol@example.com',
        name: 'Carol',
        password: 'password',
        image_url: '',
        role: Role.USER,
      },
      {
        email: 'admin@example.com',
        name: 'Admin',
        password: 'adminpassword',
        image_url: '',
        role: Role.ADMIN,
      },
      {
        email: 'engineer@example.com',
        name: 'Engineer',
        password: 'engpassword',
        image_url: '',
        role: Role.ENGINEER,
      },
    ],
  });

  // Mock Floors
  const floors_create = await prisma.floor.createMany({
    //create 10 floors F1 to F10
    data: [
      { floor_number: 'F1' },
      { floor_number: 'F2' },
      { floor_number: 'F3' },
      { floor_number: 'F4' },
      { floor_number: 'F5' },
      { floor_number: 'F6' },
      { floor_number: 'F7' },
      { floor_number: 'F8' },
      { floor_number: 'F9' },
      { floor_number: 'F10' },
    ],
  });

  // Mock Parking Slots
  const floors = await prisma.floor.findMany();
  const parkingSlots_create = await prisma.parking_slots.createMany({
    data: [
      { slot_number: 'A1', status: ParkingStatus.IDLE, floor_id: floors[0].id },
      { slot_number: 'A2', status: ParkingStatus.IDLE, floor_id: floors[0].id },
      { slot_number: 'A3', status: ParkingStatus.IDLE, floor_id: floors[0].id },
      { slot_number: 'B1', status: ParkingStatus.IDLE, floor_id: floors[0].id },
      { slot_number: 'B2', status: ParkingStatus.IDLE, floor_id: floors[0].id },
      { slot_number: 'B3', status: ParkingStatus.IDLE, floor_id: floors[0].id },
      { slot_number: 'C1', status: ParkingStatus.IDLE, floor_id: floors[1].id },
    ],
  });

  const users = await prisma.users.findMany();
  const parkingSlots = await prisma.parking_slots.findMany();
  // Mock Reservations
  const reservations = await prisma.reservations.createMany({
    data: [
      { user_id: users[0].id, parking_slot_id: parkingSlots[0].id },
      { user_id: users[1].id, parking_slot_id: parkingSlots[1].id },
      { user_id: users[2].id, parking_slot_id: parkingSlots[2].id },
      { user_id: users[3].id, parking_slot_id: parkingSlots[3].id },
      { user_id: users[4].id, parking_slot_id: parkingSlots[4].id },
    ],
  });

  // Mock Cars
  const cars = await prisma.cars.createMany({
    data: [
      {
        car_number: 'AB1234CD',
        car_model: 'Toyota Camry',
        car_type: 'Sedan',
        image_url: '/file/4d0bfd62-bd02-47a3-9faa-de4dcb505b5d-18-1.png',
        user_id: users[0].id,
      },
      {
        car_number: 'BC2345DE',
        car_model: 'Honda Civic',
        car_type: 'Sedan',
        image_url: '/file/5de54d45-ee40-41db-a422-f0bb9df2b63b-18-1.png',
        user_id: users[1].id,
      },
      {
        car_number: 'CD3456EF',
        car_model: 'Ford Focus',
        car_type: 'Hatchback',
        image_url: '/file/14b6876f-750d-446f-9a43-06c9210aed75-18-1.png',
        user_id: users[2].id,
      },
      {
        car_number: 'DE4567FG',
        car_model: 'BMW 320i',
        car_type: 'Sedan',
        image_url: '/file/14b6876f-750d-446f-9a43-06c9210aed75-18-1.png',
        user_id: users[3].id,
      },
      {
        car_number: 'EF5678GH',
        car_model: 'Audi A4',
        car_type: 'Sedan',
        image_url: '/file/4d0bfd62-bd02-47a3-9faa-de4dcb505b5d-18-1.png',
        user_id: users[4].id,
      },
    ],
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
