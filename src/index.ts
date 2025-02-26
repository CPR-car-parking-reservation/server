import { Elysia } from 'elysia';
import { users_route } from '@/route/users';
import { file_route } from '@/route/file_route';
import { cars_route } from '@/route/cars';
import { parking_slots_route } from '@/route/parking_slots';
import swagger from '@elysiajs/swagger';
import { reservation_route } from '@/route/reserv';
import { floor_route } from '@/route/floor';

import '@/mqtt/handler';
const app = new Elysia()
  .onError(({ code, error }) => {
    console.log(error);
    return { message: 'Internal Server error', status: code };
  })
  .use(
    swagger({
      provider: 'swagger-ui',
    })
  )
  .use(parking_slots_route)
  .use(file_route)
  .use(users_route)
  .use(cars_route)
  .use(reservation_route)
  .use(floor_route)

  .listen(process.env.PORT!);

console.log(`Server running on port ${process.env.PORT}`);
