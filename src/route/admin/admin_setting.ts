import { Elysia, t } from 'elysia';
import { PrismaClient, Role } from '@prisma/client';
import { middleware } from '@/lib/auth';

export const admin_setting_route = new Elysia({ prefix: '/admin/setting/price' })
  .use(middleware)
  .get('/', async ({ set, auth_user }) => {
    if (!auth_user || auth_user.role !== Role.ADMIN) {
      set.status = 401;
      return { message: 'Unauthorized', status: 401 };
    }
    const prisma = new PrismaClient();
    const setting = await prisma.setting.findMany();
    set.status = 200;
    prisma.$disconnect();
    return { data: setting[0].charge_rate, status: 200 };
  })
  .put(
    '/',
    async ({ auth_user, set, body }) => {
      if (!auth_user || auth_user.role !== Role.ADMIN) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        const { charge_rate } = body;
        const prisma = new PrismaClient();
        const this_charge_rate = await prisma.setting.findMany();

        await prisma.setting.update({
          where: {
            id: this_charge_rate[0].id,
          },
          data: {
            charge_rate: charge_rate,
          },
        });
        set.status = 200;
        prisma.$disconnect();
        return { message: 'Price setting updated', status: 200 };
      } catch (e: any) {
        set.status = 400;
      }
    },
    {
      body: t.Object({
        charge_rate: t.Number(),
      }),
    }
  );
