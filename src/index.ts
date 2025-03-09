import { Elysia } from 'elysia';
import { users_route } from '@/route/profile';
import { file_route } from '@/route/file_route';
import { cars_route } from '@/route/cars';
import { parking_slots_route } from '@/route/parking_slots';
import swagger from '@elysiajs/swagger';
import { reservation_route } from '@/route/reserv';
import { floor_route } from '@/route/floor';
import { register_route } from '@/route/auth/register';
import { login_route } from '@/route/auth/login';
import { admin_users_route } from '@/route/admin/admin_user';
import { admin_parking_route } from '@/route/admin/admin_parking';
import jwt from '@elysiajs/jwt';
import '@/mqtt/handler';
import { admin_reservation_route } from '@/route/admin/admin_reservation';
import { logout_route } from './route/auth/logout';
import { admin_dashboard_route } from './route/admin/admin_dashboard';
import { admin_setting_route } from './route/admin/admin_setting';
import { cron } from '@elysiajs/cron';
import { ParkingStatus, PrismaClient, ReservationStatus } from '@prisma/client';

export const prisma = new PrismaClient();
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
  .use(
    cron({
      name: 'heartbeat',
      pattern: '*/1 * * * *',
      run() {
        const prisma = new PrismaClient();
        console.log('Cron job running');

        prisma.reservations
          .findMany({
            where: {
              created_at: {
                lte: new Date(new Date().getTime() - 60 * 60 * 1000),
              },
              status: ReservationStatus.WAITING,
            },
          })
          .then((reservations) => {
            reservations.forEach((reservation) => {
              prisma.reservations
                .update({
                  where: {
                    id: reservation.id,
                  },
                  data: {
                    status: ReservationStatus.EXPIRED,
                  },
                })
                .then(() => {
                  prisma.parking_slots.update({
                    where: {
                      id: reservation.parking_slot_id,
                    },
                    data: {
                      status: ParkingStatus.IDLE,
                    },
                  });
                });
            });
          });
        prisma.$disconnect();
      },
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
  .use(admin_reservation_route)
  .use(admin_dashboard_route)
  .use(logout_route)
  .use(admin_setting_route)

  .listen(process.env.PORT!);

console.log(`Server running on port ${process.env.PORT}`);
