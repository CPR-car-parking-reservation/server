import { Elysia, t } from 'elysia';
import { PrismaClient, Role } from '@prisma/client';

export const admin_users_route = new Elysia({ prefix: 'admin/users' })
  // .onBeforeHandle(adminAuthMiddleware)

  .get('/', async ({ set }) => {
    try {
      // const auth_user = await jwt.verify(token, process.env.JWT_SECRET!);

      const prisma = new PrismaClient();
      const users = await prisma.users.findMany({ include: { Car: true } });
      set.status = 200;
      return { data: users, status: 200 };
    } catch (e: any) {
      return { message: 'Internal Server Error' };
    }
  });
// POST Create User

// .get(
//   "/get_name_role",
//   async ({ query }) => {
//     const prisma = new PrismaClient();
//     const { name, role } = query;

//     const user = await prisma.users.findFirst({
//       where: {
//         name: name,
//         role: role as Role,
//       },
//     });

//     if(!user) {
//       return { message: "User not found" };
//     }

//     return { user };
//   },
//   {
//     query: t.Object({
//       name: t.String(),
//       role: t.String(),
//     }),
//   }
// )
