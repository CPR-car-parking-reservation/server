import Elysia from 'elysia';
import { ParkingStatus, PrismaClient } from '@prisma/client';
import { t } from 'elysia';
import {
  validate_create_parking_slot,
  validate_update_parking_slot,
  validate_get_parking_slot,
} from '@/lib/zod_schema';

const prisma = new PrismaClient();

export const parking_slots_route = new Elysia({
  prefix: '/parking_slots',
})
  .get(
    '/',
    async ({ query, set }) => {
      console.log('query', query);
      try {
        const { search, floor, status } = query;
        console.log(query);

        const filters: any = {};

        if (search) {
          filters.slot_number = {
            contains: search,
          };
        }

        if (floor) {
          filters.floor = {
            floor_number: floor,
          };
        }

        if (status) {
          filters.status = status as ParkingStatus; // ตรวจสอบให้แน่ใจว่า status เป็นค่าที่อยู่ใน enum ParkingStatus
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
    async ({ body, set }) => {
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
        console.log('floor', floor);

        const new_parking_slot = await prisma.parking_slots.create({
          data: {
            slot_number: slot_number,
            floor_id: floor.id,
          },
        });

        set.status = 200;
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
    async ({ body, set, params }) => {
      console.log('api');

      try {
        const { floor_number, slot_number } = body;
        const { parking_slot_id } = params;
        // console.log('floor_number', floor_number);
        // console.log('slot_number', slot_number);
        // console.log('parking_slot_id', parking_slot_id);
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
          },
        });
        set.status = 200;
        return {
          message: 'parking slot created successfully',
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
      }),
      params: t.Object({
        parking_slot_id: t.String(),
      }),
    }
  )
  .delete(
    '/id/:parking_slot_id',
    async ({ params, set }) => {
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

        set.status = 200;
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
