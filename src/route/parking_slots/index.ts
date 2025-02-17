import Elysia from 'elysia';
import { ParkingStatus, PrismaClient } from '@prisma/client';
import { t } from 'elysia';
import { validate_car_create, validate_car_update } from '@/lib/zod_schema';

export const parking_slots_route = new Elysia({
  prefix: '/parking_slots',
}).post(
  '/',
  async ({ body }) => {
    const prisma = new PrismaClient();
    const data = body.data;

    //check if have that slot number in parking slots
    for (const item of data) {
      const is_has_slots_name = await prisma.parking_slots.findUnique({
        where: {
          slot_number: item.name,
        },
      });

      if (!is_has_slots_name) {
        return {
          message: `Slot number ${item.name} not found`,
          status: 404,
        };
      }
    }

    //update parking slots status
    await Promise.all(
      data.map(async (item) => {
        await prisma.parking_slots.update({
          where: { slot_number: item.name },
          data: {
            status: item.is_car_in_parking_slot ? ParkingStatus.FULL : ParkingStatus.IDLE,
          },
        });
      })
    );

    //query all parking slots status
    const parking_slots_status = await prisma.parking_slots.findMany({
      select: {
        slot_number: true,
        status: true,
      },
    });

    return {
      data: parking_slots_status,
      status: 200,
    };
  },
  {
    body: t.Object({
      data: t.Array(
        t.Object({
          name: t.String(),
          is_car_in_parking_slot: t.Boolean(),
        })
      ),
    }),
  }
);
