import { Elysia } from 'elysia';
import { users_route } from '@/route/profile';
import { file_route } from '@/route/file_route';
import { cars_route } from '@/route/cars';
import { parking_slots_route } from '@/route/parking_slots';
import swagger from '@elysiajs/swagger';
import { reservation_route } from '@/route/reserv';
import { floor_route } from '@/route/floor';
import { register_route } from './route/auth/register';
import { login_route } from './route/auth/login';
import { admin_users_route } from './route/admin/admin_user';
import { admin_parking_route } from './route/admin/admin_parking';
import jwt from '@elysiajs/jwt';

const app = new Elysia()
  .onError(({ code, error }) => {
    console.log(error);
    return { message: 'Internal Server error', status: code };
  })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET!,
      exp: '1d',
    })
  )
  .use(
    swagger({
      provider: 'swagger-ui',
    })
  )
  .use(admin_users_route)
  .use(parking_slots_route)
  .use(file_route)
  .use(users_route)
  .use(cars_route)
  .use(reservation_route)
  .use(floor_route)
  .use(register_route)
  .use(login_route)
  .use(admin_parking_route)

  .listen(process.env.PORT!);

console.log(`Server running on port ${process.env.PORT}`);
