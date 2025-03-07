import { PrismaClient, Role, ParkingStatus, ReservationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

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
        email: 'user',
        name: 'User',
        surname: 'User',
        password: await bcrypt.hash('12345678', 10),
        image_url: '/file/account-default.png',
        phone: '0812345670',
        role: Role.USER,
      },
      {
        email: 'user2',
        name: 'User2',
        surname: 'User2',
        password: await bcrypt.hash('12345678', 10),
        image_url: '/file/account-default.png',
        phone: '0812345671',
        role: Role.USER,
      },
      {
        email: 'user3',
        name: 'User3',
        surname: 'User3',
        password: await bcrypt.hash('12345678', 10),
        image_url: '/file/account-default.png',
        phone: '0812345672',
        role: Role.USER,
      },
      {
        email: 'user4',
        name: 'User4',
        surname: 'User4',
        password: await bcrypt.hash('12345678', 10),
        image_url: '/file/account-default.png',
        phone: '0812345673',
        role: Role.USER,
      },
      {
        email: 'user5',
        name: 'User5',
        surname: 'User5',
        password: await bcrypt.hash('12345678', 10),
        image_url: '/file/account-default.png',
        phone: '0812345674',
        role: Role.USER,
      },
      {
        email: 'admin',
        name: 'Admin',
        surname: 'Admin',
        password: await bcrypt.hash('12345678', 10),
        image_url: '/file/account-default.png',
        phone: '0812345675',
        role: Role.ADMIN,
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
    ],
  });

  // Mock Parking Slots
  const floors = await prisma.floor.findMany();
  const parkingSlots_create = await prisma.parking_slots.createMany({
    data: [
      { slot_number: 'A1', status: ParkingStatus.RESERVED, floor_id: floors[0].id },
      { slot_number: 'A2', status: ParkingStatus.RESERVED, floor_id: floors[0].id },
      { slot_number: 'A3', status: ParkingStatus.RESERVED, floor_id: floors[0].id },
      { slot_number: 'B1', status: ParkingStatus.RESERVED, floor_id: floors[0].id },
      { slot_number: 'B2', status: ParkingStatus.RESERVED, floor_id: floors[0].id },
      { slot_number: 'B3', status: ParkingStatus.RESERVED, floor_id: floors[0].id },
      { slot_number: 'C1', status: ParkingStatus.RESERVED, floor_id: floors[1].id },
    ],
  });

  const users = await prisma.users.findMany();

  // Mock Cars
  const cars = await prisma.cars.createMany({
    data: [
      {
        license_plate: 'ฟก1234',
        car_model: 'Toyota Camry',
        car_type: 'Electric',
        image_url: '/file/4d0bfd62-bd02-47a3-9faa-de4dcb505b5d-18-1.png',
        user_id: users[0].id,
      },
      {
        license_plate: '2กข3456',
        car_model: 'Honda Civic',
        car_type: 'Electric',
        image_url: '/file/5de54d45-ee40-41db-a422-f0bb9df2b63b-18-1.png',

        user_id: users[0].id,
      },
      {
        license_plate: 'ฆษ8888',
        car_model: 'Ford Focus',
        car_type: 'Electric',
        image_url: '/file/14b6876f-750d-446f-9a43-06c9210aed75-18-1.png',
        user_id: users[0].id,
      },
      {
        license_plate: '4คน7890',
        car_model: 'BMW 320i',
        car_type: 'Electric',
        image_url: '/file/14b6876f-750d-446f-9a43-06c9210aed75-18-1.png',
        user_id: users[0].id,
      },
      {
        license_plate: '5จง8901',
        car_model: 'Audi A4',
        car_type: 'Electric',
        image_url: '/file/4d0bfd62-bd02-47a3-9faa-de4dcb505b5d-18-1.png',
        user_id: users[1].id,
      },
      {
        license_plate: 'งว1234',
        car_model: 'Mazda 3',
        car_type: 'Fuels',
        image_url: '/file/5de54d45-ee40-41db-a422-f0bb9df2b63b-18-1.png',
        user_id: users[1].id,
      },
      {
        license_plate: 'มอ3456',
        car_model: 'Mazda 3',
        car_type: 'Fuels',
        image_url: '/file/5de54d45-ee40-41db-a422-f0bb9df2b63b-18-1.png',

        user_id: users[1].id,
      },
      {
        license_plate: 'รก5678',
        car_model: 'Mazda 3',
        car_type: 'Fuels',
        image_url: '/file/5de54d45-ee40-41db-a422-f0bb9df2b63b-18-1.png',

        user_id: users[1].id,
      },
      {
        license_plate: 'วข7890',
        car_model: 'Mazda 3',
        car_type: 'Fuels',
        image_url: '/file/5de54d45-ee40-41db-a422-f0bb9df2b63b-18-1.png',

        user_id: users[1].id,
      },
    ],
  });

  const parkingSlots = await prisma.parking_slots.findMany();
  const fetch_cars = await prisma.cars.findMany();
  // Mock Reservations
  // const reservations = await prisma.reservations.createMany({
  //   data: [
  //     {
  //       user_id: users[0].id,
  //       parking_slot_id: parkingSlots[0].id,
  //       car_id: fetch_cars[0].id,
  //       start_at: new Date(),

  //       status: ReservationStatus.WAITING,
  //     },
  //     {
  //       user_id: users[1].id,
  //       parking_slot_id: parkingSlots[1].id,
  //       car_id: fetch_cars[0].id,
  //       start_at: new Date(),
  //       // start_at: new Date(thaiTime.toString()),
  //       // end_at: new Date(thaiTime.toString()),
  //     },
  //     {
  //       user_id: users[2].id,
  //       parking_slot_id: parkingSlots[2].id,
  //       car_id: fetch_cars[0].id,
  //       start_at: new Date(),
  //       // start_at: new Date(thaiTime.toString()),
  //       // end_at: new Date(thaiTime.toString()),
  //     },
  //     {
  //       user_id: users[3].id,
  //       parking_slot_id: parkingSlots[3].id,
  //       car_id: fetch_cars[0].id,
  //       start_at: new Date(),
  //       // start_at: new Date(thaiTime.toString()),
  //       // end_at: new Date(thaiTime.toString()),
  //     },
  //     {
  //       user_id: users[4].id,
  //       parking_slot_id: parkingSlots[4].id,
  //       car_id: fetch_cars[0].id,
  //       start_at: new Date(),
  //       // start_at: new Date(thaiTime.toString()),
  //       // end_at: new Date(thaiTime.toString()),
  //     },
  //     {
  //       user_id: users[0].id,
  //       parking_slot_id: parkingSlots[5].id,
  //       car_id: fetch_cars[0].id,
  //       start_at: new Date(),
  //       // start_at: new Date(thaiTime.toString()),
  //       // end_at: new Date(thaiTime.toString()),
  //     },
  //   ],
  // });

  const setting = await prisma.setting.create({
    data: {
      charge_rate: 20,
    },
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
