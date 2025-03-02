import { Elysia, t } from 'elysia';
import { ParkingStatus, PrismaClient } from '@prisma/client';
import { validate_reservation_praking } from '@/lib/zod_schema';
import { middleware } from '@/lib/auth';
const prisma = new PrismaClient();

export const reservation_route = new Elysia({ prefix: '/reservation' })
  .use(middleware)
  .get('/', async () => {
    const reservation = await prisma.reservations.findMany({
      include: {
        parking_slots: true,
      },
    });
    return { data: reservation, status: 200 };
  })
  // .post(
  //   '/',
  //   ({ body }) => {
  //     const { id } = body;
  //     console.log('id', id);
  //     if (id == '41486940-f14c-4289-b78e-a0351922916b') {
  //       return 'open door';
  //     }
  //     return 'failed';
  //   },
  //   {
  //     body: t.Object({
  //       id: t.String(),
  //     }),
  //   }
  // );

  .post(
    '/',
    async ({ body, auth_user }) => {
      if (!auth_user) {
        return { message: 'Unauthorized', status: 401 };
      }
      const { car_id, parking_slot_id, start_at } = body;

      const start_at_date = new Date(start_at);
      console.log('start_at_date', start_at_date);

      const validate = validate_reservation_praking.safeParse(body);

      if (!validate.success) {
        return { message: validate.error.issues[0].message, status: 400 };
      }

      const this_slot = await prisma.parking_slots.findUnique({
        where: {
          id: parking_slot_id,
          status: ParkingStatus.IDLE,
        },
      });

      if (!this_slot) {
        return { message: 'This slot is not available ', status: 400 };
      }

      const user = await prisma.users.findUnique({
        where: {
          id: auth_user.id,
        },
      });

      if (!user) {
        return { message: 'User not found', status: 400 };
      }

      const car = await prisma.cars.findUnique({
        where: {
          id: car_id,
        },
      });

      if (!car) {
        return { message: 'Car not found', status: 400 };
      }
      console.log('user_id', auth_user.id);
      console.log('car_id', car_id);
      console.log('parking_slot_id', parking_slot_id);
      console.log('start_at', start_at);

      const new_reserv = await prisma.reservations.create({
        data: {
          user_id: auth_user.id,
          parking_slot_id,
          car_id,
          start_at: start_at_date,
        },
      });

      if (!new_reserv) {
        return { message: 'Create reserv failed', status: 400 };
      }

      const update_slot = await prisma.parking_slots.update({
        where: {
          id: parking_slot_id,
        },
        data: {
          status: ParkingStatus.RESERVED,
        },
      });

      if (!update_slot) {
        return { message: 'Update slot failed', status: 400 };
      }

      return { data: new_reserv, message: 'Reserv created successfully', status: 200 };
    },
    {
      body: t.Object({
        car_id: t.String(),
        parking_slot_id: t.String(),
        start_at: t.String(),
      }),
    }
  );
