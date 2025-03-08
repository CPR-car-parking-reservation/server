import { Elysia, t } from 'elysia';
import { ParkingStatus, PrismaClient, ReservationStatus } from '@prisma/client';
import { validate_reservation_praking } from '@/lib/zod_schema';
import { middleware } from '@/lib/auth';
import { send_display, send_slot_status_to_board, send_trigger_mobile } from '@/mqtt/handler';
const prisma = new PrismaClient();

export const reservation_route = new Elysia({ prefix: '/reservation' })
  .use(middleware)
  .get('/user', async ({ auth_user, set }) => {
    if (!auth_user) {
      set.status = 401;
      return { message: 'Unauthorized', status: 401 };
    }
    try {
      const reservation = await prisma.reservations.findMany({
        where: {
          user_id: auth_user.id,
        },
        include: {
          parking_slots: true,
          car: true,
        },
        orderBy: {
          start_at: 'desc',
        },
      });
      set.status = 200;
      return { data: reservation, status: 200 };
    } catch (e: any) {
      set.status = 400;
      return { message: 'Internal Server Error', status: 400 };
    }
  })

  .post(
    '/',
    async ({ body, auth_user, set }) => {
      if (!auth_user) {
        return { message: 'Unauthorized', status: 401 };
      }
      const { car_id, parking_slot_id, start_at } = body;
      console.log(body);

      const start_at_date = new Date(start_at);
      console.log('start_at_date', start_at_date);

      const validate = validate_reservation_praking.safeParse(body);

      if (!validate.success) {
        set.status = 400;
        return { message: validate.error.issues[0].message, status: 400 };
      }

      const is_reserved = await prisma.reservations.findFirst({
        where: {
          user_id: auth_user.id,
          end_at: null,
          status: ReservationStatus.WAITING,
        },
      });

      if (is_reserved) {
        set.status = 400;
        return { message: 'please finish or cancel your reservation', status: 400 };
      }

      const this_slot = await prisma.parking_slots.findUnique({
        where: {
          id: parking_slot_id,
          status: ParkingStatus.IDLE,
        },
        include: {
          floor: true,
        },
      });

      if (!this_slot) {
        set.status = 400;
        return { message: 'This slot is not available ', status: 400 };
      }

      const user = await prisma.users.findUnique({
        where: {
          id: auth_user.id,
        },
      });

      if (!user) {
        set.status = 400;
        return { message: 'User not found', status: 400 };
      }

      const car = await prisma.cars.findUnique({
        where: {
          id: car_id,
        },
      });

      if (!car) {
        set.status = 400;
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
        set.status = 400;
        return { message: 'Failed to create reservation', status: 400 };
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
        set.status = 400;
        return { message: 'Failed to update slot', status: 400 };
      }

      send_slot_status_to_board(
        this_slot.slot_number,
        this_slot.floor.floor_number,
        ParkingStatus.RESERVED
      );
      send_display(this_slot.slot_number, car.license_plate);
      send_trigger_mobile();
      set.status = 200;
      return { data: new_reserv, message: 'Reservation created successfully', status: 200 };
    },
    {
      body: t.Object({
        car_id: t.String(),
        parking_slot_id: t.String(),
        start_at: t.String(),
      }),
    }
  )
  .post('/cancel/id/:reservation_id', async ({ auth_user, set, params }) => {
    if (!auth_user) {
      return { message: 'Unauthorized', status: 401 };
    }
    console.log('cancel reservation call');
    const { reservation_id } = params;
    const reservation = await prisma.reservations.findUnique({
      where: {
        id: reservation_id,
        user_id: auth_user.id,
        status: ReservationStatus.WAITING,
        end_at: null,
      },
      include: {
        parking_slots: {
          include: {
            floor: true,
          },
        },
      },
    });

    if (!reservation) {
      set.status = 400;
      return { message: 'Reservation not found', status: 400 };
    }

    const update_slot = await prisma.parking_slots.update({
      where: {
        id: reservation.parking_slot_id,
      },
      data: {
        status: ParkingStatus.IDLE,
      },
    });

    if (!update_slot) {
      set.status = 400;
      return { message: 'Failed to update slot', status: 400 };
    }

    const cancel_reservation = await prisma.reservations.update({
      where: {
        id: reservation_id,
      },
      data: {
        status: ReservationStatus.CANCEL,
      },
    });

    if (!cancel_reservation) {
      set.status = 400;
      return { message: 'Failed to cancel reservation', status: 400 };
    }

    send_slot_status_to_board(
      reservation.parking_slots.slot_number,
      reservation.parking_slots.floor.floor_number,
      ParkingStatus.IDLE
    );
    send_display(reservation.parking_slots.slot_number, '');
    set.status = 200;
    return { message: 'Reservation canceled successfully', status: 200 };
  });
