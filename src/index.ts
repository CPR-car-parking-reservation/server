import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { users_route } from './route/users/users_route';
import { file_route } from './route/file_route';

const app = new Elysia()
  .use(file_route)
  .use(users_route)
  .onError(({ error, code }) => {
    console.log('Error: ', error, code);
    return { message: 'Internal server error' };
  })
  .listen(process.env.PORT!);

console.log(`Server running on port ${process.env.PORT}`);
