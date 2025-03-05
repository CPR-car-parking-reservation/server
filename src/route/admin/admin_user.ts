import { Elysia, t } from 'elysia';
import { PrismaClient, Role } from '@prisma/client';
import { middleware } from '@/lib/auth';
import { log } from 'console';

export const admin_users_route = new Elysia({ prefix: 'admin/users' }).use(middleware).get(
  '/',
  async ({ set, query, auth_user }) => {
    log('auth_user', auth_user);
    try {
      if (!auth_user || auth_user.role !== Role.ADMIN) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }

      const { search } = query;
      console.log('query', query);

      const prisma = new PrismaClient();
      const users = await prisma.users.findMany({
        omit: {
          password: true,
        },
        where: {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { surname: { contains: search, mode: 'insensitive' } },
          ],
          email: { not: 'admin' },
        },
        include: { car: true },
      });

      set.status = 200;
      return { data: users, status: 200 };
    } catch (e: any) {
      return { message: 'Internal Server Error' };
    }
  },
  {
    query: t.Object({ search: t.Optional(t.String()) }),
  }
);
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
