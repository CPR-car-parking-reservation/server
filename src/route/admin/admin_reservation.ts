import { Elysia, t } from 'elysia';
import { PrismaClient, Role } from '@prisma/client';
import { middleware } from '@/lib/auth';

export const admin_reservation_route = new Elysia({ prefix: '/admin/reservation' })
  .use(middleware)
  .get('/', async ({ auth_user, set }) => {
    if (!auth_user || auth_user.role !== Role.ADMIN) {
      set.status = 401;
      return { message: 'Unauthorized', status: 401 };
    }
    try {
      const prisma = new PrismaClient();
      const reservation = await prisma.reservations.findMany();
      set.status = 200;

      prisma.$disconnect();
      return { data: reservation, status: 200 };
    } catch (e: any) {
      set.status = 400;
      return { message: 'Internal Server Error', status: 400 };
    }
  });
