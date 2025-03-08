// import { prisma } from '@/index';
import { prisma } from '@/index';
import { middleware } from '@/lib/auth';
import { validate_create_parking_slot, validate_update_parking_slot } from '@/lib/zod_schema';
import { send_slot_status_to_board, send_trigger_mobile } from '@/mqtt/handler';
import { ParkingStatus, PrismaClient, ReservationStatus, Role } from '@prisma/client';
import Elysia, { t } from 'elysia';

export const admin_parking_route = new Elysia({ prefix: '/admin/parking_slots' })
  .use(middleware)
  .get(
    '/',
    async ({ query, set, auth_user }) => {
      if (!auth_user || auth_user.role !== Role.ADMIN) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        const { search, floor, status } = query;
        console.log('query', query);
        const filters: any = {};

        if (search) {
          filters.slot_number = {
            contains: search,
            mode: 'insensitive',
          };
        }

        if (floor) {
          filters.floor = {
            floor_number: floor,
          };
        }

        if (status) {
          filters.status = status as ParkingStatus;
        }

        const parking_slots = await prisma.parking_slots.findMany({
          where: filters,
          orderBy: {
            slot_number: 'asc',
          },
          include: {
            floor: true,
          },
        });

        set.status = 200;
        prisma.$disconnect();
        return { data: parking_slots, status: 200 };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        floor: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
    }
  )

  .post(
    '/',
    async ({ body, set, auth_user }) => {
      if (!auth_user || auth_user.role !== Role.ADMIN) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        const { floor_number, slot_number } = body;

        const validated_parking_slots = validate_create_parking_slot.safeParse(body);

        if (!validated_parking_slots.success) {
          set.status = 400;
          return { message: validated_parking_slots.error.issues[0].message };
        }

        const is_slot_number = await prisma.parking_slots.findUnique({
          where: {
            slot_number: slot_number,
          },
        });

        if (is_slot_number) {
          set.status = 400;
          return {
            message: 'slot number already exits',
            status: 400,
          };
        }

        const is_parking_in_floor = await prisma.parking_slots.findMany({
          include: {
            floor: true,
          },
          where: {
            floor: {
              floor_number: floor_number,
            },
          },
        });

        if (is_parking_in_floor.length >= 6) {
          set.status = 400;
          return {
            message: 'parking slot in floor is full',
            status: 400,
          };
        }

        const floor = await prisma.floor.findFirst({
          where: {
            floor_number: floor_number,
          },
        });

        if (!floor) {
          set.status = 400;
          return {
            message: 'floor not found',
            status: 400,
          };
        }

        const new_parking_slot = await prisma.parking_slots.create({
          data: {
            slot_number: slot_number,
            floor_id: floor.id,
          },
        });

        set.status = 200;
        send_trigger_mobile();
        prisma.$disconnect();
        return {
          message: 'parking slot created successfully',
          data: new_parking_slot,
          status: 200,
        };
      } catch (e: any) {
        console.log(e);
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        slot_number: t.String(),
        floor_number: t.String(),
      }),
    }
  )
  .put(
    '/id/:parking_slot_id',
    async ({ body, set, params, auth_user }) => {
      if (!auth_user || auth_user.role !== Role.ADMIN) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        const { floor_number, slot_number, status } = body;
        const { parking_slot_id } = params;

        const validated_parking_slots = validate_update_parking_slot.safeParse(body);

        if (!validated_parking_slots.success) {
          return { message: validated_parking_slots.error.issues[0].message };
        }

        const is_slot_number = await prisma.parking_slots.findUnique({
          where: {
            id: parking_slot_id,
          },
        });

        if (!is_slot_number) {
          set.status = 400;
          return {
            message: 'parking slot not found',
            status: 400,
          };
        }

        const floor = await prisma.floor.findFirst({
          where: {
            floor_number: floor_number,
          },
        });

        if (!floor) {
          set.status = 400;
          return {
            message: 'floor not found',
            status: 400,
          };
        }

        const updated_parking_slot = await prisma.parking_slots.update({
          where: { id: parking_slot_id },
          data: {
            slot_number: slot_number,
            floor_id: floor.id,
            status: status == 'MAINTENANCE' ? ParkingStatus.MAINTENANCE : ParkingStatus.IDLE,
          },
        });
        if (status == 'MAINTENANCE') {
          await prisma.reservations.updateMany({
            where: {
              parking_slot_id: parking_slot_id,
              end_at: null,
              OR: [
                {
                  status: ReservationStatus.OCCUPIED,
                },
                {
                  status: ReservationStatus.WAITING,
                },
              ],
            },
            data: {
              status: ReservationStatus.CANCEL,
            },
          });
          send_slot_status_to_board(
            updated_parking_slot.slot_number,
            floor.floor_number,
            'MAINTENANCE'
          );
        } else {
          send_slot_status_to_board(updated_parking_slot.slot_number, floor.floor_number, 'IDLE');
        }
        prisma.$disconnect();
        send_trigger_mobile();
        set.status = 200;
        return {
          message: 'parking slot updated successfully',
          data: updated_parking_slot,
          status: 200,
        };
      } catch (e: any) {
        console.log(e);
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        slot_number: t.String(),
        floor_number: t.String(),
        status: t.String(),
      }),
      params: t.Object({
        parking_slot_id: t.String(),
      }),
    }
  )
  .delete(
    '/id/:parking_slot_id',
    async ({ params, set, auth_user }) => {
      if (!auth_user || auth_user.role !== Role.ADMIN) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        const { parking_slot_id } = params;

        const is_parking_slot = await prisma.parking_slots.findUnique({
          where: { id: parking_slot_id },
        });

        if (!is_parking_slot) {
          set.status = 404;
          return { message: 'Parking slot not found' };
        }

        const linked_reservations = await prisma.reservations.findMany({
          where: { parking_slot_id },
        });

        if (linked_reservations.length > 0) {
          set.status = 400;
          return { message: 'Cannot delete parking slot because it has linked reservations' };
        }

        await prisma.parking_slots.delete({
          where: { id: parking_slot_id },
        });
        send_trigger_mobile();
        set.status = 200;
        prisma.$disconnect();
        return { message: 'Delete parking slot success' };
      } catch (e: any) {
        // console.log(e);
        set.status = 500;
        return { message: 'Internal Server Error' };
      }
    },
    {
      params: t.Object({
        parking_slot_id: t.String(),
      }),
    }
  );
