import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { users_route } from './route/users';
import { file_route } from './route/file_route';
import { cars_route } from './route/cars';
import { parking_slots_route } from './route/parking_slots';

const app = new Elysia()
  .use(parking_slots_route)
  .use(file_route)
  .use(users_route)
  .use(cars_route)
  .onError(({ error, code }) => {
    console.log('Error: ', error, code);
    return { message: 'Internal server error' };
  })
  .listen(process.env.PORT!);

console.log(`Server running on port ${process.env.PORT}`);
