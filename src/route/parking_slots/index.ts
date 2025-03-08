import Elysia from 'elysia';
import { ParkingStatus, PrismaClient } from '@prisma/client';
import { t } from 'elysia';

export const parking_slots_route = new Elysia({
  prefix: '/parking_slots',
}).get(
  '/',
  async ({ query, set }) => {
    console.log('parking_slots_route');
    try {
      const { search, floor, status } = query;
      1;
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
        filters.status = status as ParkingStatus;
      }
      const prisma = new PrismaClient();
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
);
