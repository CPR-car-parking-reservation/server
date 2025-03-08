import { PrismaClient } from '@prisma/client';
import { t, Elysia } from 'elysia';
import { validate_create_floor, validate_update_floor } from '@/lib/zod_schema';
import { Param } from '@prisma/client/runtime/library';
import { DateTime } from 'luxon';

function getDiffHours(start: string, end: string): number {
  const startTime = DateTime.fromISO(start).setZone('Asia/Bangkok');
  const endTime = DateTime.fromISO(end).setZone('Asia/Bangkok');

  return endTime.diff(startTime, 'hours').hours;
}

export const floor_route = new Elysia({ prefix: '/floors' })

  .get('/', async ({ set }) => {
    const prisma = new PrismaClient();
    const floors = await prisma.floor.findMany();
    set.status = 200;
    prisma.$disconnect();
    return { data: floors, status: 200 };
  })

  .post(
    '/',
    async ({ body, set }) => {
      try {
        const { floor_number } = body;
        const validate = validate_create_floor.safeParse(body);

        if (!validate.success) {
          return { message: validate.error.issues[0].message };
        }
        const prisma = new PrismaClient();
        const is_floor_exist = await prisma.floor.findFirst({
          where: {
            floor_number,
          },
        });

        if (is_floor_exist) {
          return { message: 'Floor already exist' };
        }

        const new_floor = await prisma.floor.create({
          data: {
            floor_number,
          },
        });
        set.status = 200;
        prisma.$disconnect();
        return { data: new_floor, message: 'Floor created successfully', status: 200 };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        floor_number: t.String(),
      }),
    }
  );

// .put(
//   '/',
//   async ({ body }) => {
//     try {
//       const { floor_number, floor_id } = body;
//       const validate = validate_update_floor.safeParse(body);

//       if (!validate.success) {
//         return { message: validate.error.issues[0].message };
//       }

//       const this_floor = await prisma.floor.findUnique({
//         where: {
//           id: floor_id,
//         },
//       });

//       if (!this_floor) {
//         return { message: 'Floor Not found', status: 404 };
//       }

//       const updated_floor = await prisma.floor.update({
//         where: {
//           id: floor_id,
//         },
//         data: {
//           floor_number: floor_number,
//         },
//       });

//       if (!updated_floor) {
//         return { message: 'Failed to update', status: 404 };
//       }

//       return { massage: 'Floor update success', status: 200 };
//     } catch (e: any) {
//       return { message: 'Internal Server Error' };
//     }
//   },
//   {
//     body: t.Object({
//       floor_number: t.String(),
//       floor_id: t.String(),
//     }),
//   }
// )

// .delete(
//   '/id/:floor_id',
//   async ({ params }) => {
//     try {
//       const { floor_id } = await params;
//       const floor = await prisma.floor.findUnique({
//         where: {
//           id: floor_id,
//         },
//       });

//       if (!floor) {
//         return { message: 'Floor not found', status: 404 };
//       }

//       await prisma.floor.delete({
//         where: {
//           id: floor_id,
//         },
//       });

//       return { message: 'Delete floor success', status: 200 };
//     } catch (e: any) {
//       return { message: 'Internal Server Error' };
//     }
//   },
//   {
//     params: t.Object({
//       floor_id: t.String(),
//     }),
//   }
// );
