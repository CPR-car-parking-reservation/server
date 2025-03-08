import { prisma } from '@/index';
import { middleware } from '@/lib/auth';
import { ParkingStatus, PrismaClient, Role } from '@prisma/client';
import Elysia, { t } from 'elysia';

export const admin_dashboard_route = new Elysia({ prefix: '/admin/dashboard' })
  .use(middleware)
  .get('/total', async ({ query, set, auth_user }) => {
    if (!auth_user || auth_user.role !== Role.ADMIN) {
      set.status = 401;
      return { message: 'Unauthorized', status: 401 };
    }
    try {
      const idle_status = await prisma.parking_slots.count({
        where: {
          status: ParkingStatus.IDLE,
        },
      });

      const full_status = await prisma.parking_slots.count({
        where: {
          status: ParkingStatus.FULL,
        },
      });

      const reserved_status = await prisma.parking_slots.count({
        where: {
          status: ParkingStatus.RESERVED,
        },
      });

      const maintenance_status = await prisma.parking_slots.count({
        where: {
          status: ParkingStatus.MAINTENANCE,
        },
      });

      const total_user = await prisma.users.count();
      const total_cash = await prisma.reservations.aggregate({
        _sum: {
          price: true,
        },
      });

      const double_price = total_cash._sum?.price || 0.0;
      const true_price = parseFloat((double_price * 1.0).toFixed(2));

      const total = {
        idle: idle_status,
        full: full_status,
        reserved: reserved_status,
        maintenance: maintenance_status,
        total_user,
        total_cash: true_price,
      };

      set.status = 200;
      prisma.$disconnect();
      return { data: [total], status: 200 };
    } catch (e: any) {
      return { message: 'Internal Server Error' };
    }
  })
  .get('/parking', async ({ set, auth_user }) => {
    if (!auth_user || auth_user.role !== Role.ADMIN) {
      set.status = 401;
      return { message: 'Unauthorized', status: 401 };
    }
    try {
      const parking_slots = await prisma.parking_slots.findMany();
      set.status = 200;
      prisma.$disconnect();
      return { data: parking_slots, status: 200 };
    } catch (e: any) {
      return { message: 'Internal Server Error' };
    }
  })
  .get(
    '/reservations',
    async ({ set, auth_user, query }) => {
      if (!auth_user || auth_user.role !== Role.ADMIN) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }

      try {
        const { date, order } = query;

        const reservations = await prisma.reservations.findMany({
          where: {
            created_at: {
              gte: new Date(`${date} 00:00:00`),
              lte: new Date(`${date} 23:59:59`),
            },
          },
          include: {
            user: {
              include: {
                car: true,
              },
            },
            parking_slots: {
              include: {
                floor: true,
              },
            },
          },
          orderBy: {
            created_at: order === 'ASC' ? 'asc' : 'desc',
          },
        });
        set.status = 200;
        prisma.$disconnect();
        return { data: reservations, status: 200 };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      query: t.Object({
        date: t.String(),
        order: t.String(),
      }),
    }
  )
  .get(
    '/reservation_and_cash',
    async ({ query, set, auth_user }) => {
      if (!auth_user || auth_user.role !== Role.ADMIN) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        const { month, year, type } = query;
        const totalDays = new Date(parseInt(year), parseInt(month), 0).getDate();

        //create object for each day
        let days = [];
        for (let i = 1; i <= totalDays; i++) {
          const reservation_of_day = await prisma.reservations.count({
            where: {
              created_at: {
                gte: new Date(`${year}-${month}-${i} 00:00:00`),
                lte: new Date(`${year}-${month}-${i} 23:59:59`),
              },
            },
          });

          const cash_of_day = await prisma.reservations.aggregate({
            _sum: {
              price: true,
            },
            where: {
              created_at: {
                gte: new Date(`${year}-${month}-${i} 00:00:00`),
                lte: new Date(`${year}-${month}-${i} 23:59:59`),
              },
            },
          });

          if (type === 'Reservation') {
            days.push({
              day: i,
              data_number: reservation_of_day,
            });
          } else if (type === 'Cash') {
            days.push({
              day: i,
              data_number: cash_of_day._sum?.price || 0,
            });
          }
        }

        set.status = 200;
        prisma.$disconnect();
        return { data: days, status: 200 };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      query: t.Object({
        month: t.String(),
        year: t.String(),
        type: t.String(),
      }),
    }
  );
