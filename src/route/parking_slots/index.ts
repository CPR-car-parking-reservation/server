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
    async ({ query }) => {
      try {
        const { slot_number, floor, status } = query;
        const this_floor = await prisma.floor.findUnique({
          where: {
            floor_number: floor,
          },
        });

        const parking_slots = await prisma.parking_slots.findMany({
          where: {
            slot_number: slot_number,
            floor_id: this_floor?.id,
            status: status as ParkingStatus,
          },
          orderBy: {
            slot_number: 'asc',
          },
          include: {
            floor: true,
          },
        });

        return { data: parking_slots, status: 200 };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      query: t.Object({
        slot_number: t.Optional(t.String()),
        floor: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
    }
  )

  .post(
    '/',
    async ({ body }) => {
      try {
        const { floor_id, slot_number, status } = body;

        const validated_parking_slots = validate_create_parking_slot.safeParse(body);

        if (!validated_parking_slots.success) {
          return { message: validated_parking_slots.error.issues[0].message };
        }

        const is_slot_number = await prisma.parking_slots.findUnique({
          where: {
            slot_number: slot_number,
          },
        });

        if (is_slot_number) {
          return {
            message: 'slot number already exits',
            status: 400,
          };
        }

        const new_parking_slot = await prisma.parking_slots.create({
          data: {
            slot_number: slot_number,
            floor_id: floor_id,
            status: status as ParkingStatus,
          },
        });

        return {
          message: 'parking slot created successfully',
          data: new_parking_slot,
          status: 200,
        };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        slot_number: t.String(),
        floor_id: t.String(),
        status: t.String(),
      }),
    }
  )
  .put(
    '/',
    async ({ body }) => {
      try {
        const { floor_id, slot_number, status, parking_slot_id } = body;

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
          return {
            message: 'parking slot not found',
            status: 400,
          };
        }

        const updated_parking_slot = await prisma.parking_slots.update({
          where: { id: parking_slot_id },
          data: {
            slot_number: slot_number,
            floor_id: floor_id,
            status: status as ParkingStatus,
          },
        });

        return {
          message: 'parking slot created successfully',
          data: updated_parking_slot,
          status: 200,
        };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        slot_number: t.String(),
        parking_slot_id: t.String(),
        floor_id: t.String(),
        status: t.String(),
      }),
    }
  )
  .delete(
    '/id/:parking_slot_id',
    async ({ params }) => {
      try {
        const { parking_slot_id } = await params;
        const is_parking_slot = await prisma.parking_slots.findUnique({
          where: {
            id: parking_slot_id,
          },
        });

        if (!is_parking_slot) {
          return { message: 'parking slot not found', status: 404 };
        }

        await prisma.parking_slots.delete({
          where: {
            id: parking_slot_id,
          },
        });

        return { message: 'Delete parking slot success', status: 200 };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      params: t.Object({
        parking_slot_id: t.String(),
      }),
    }
  );
