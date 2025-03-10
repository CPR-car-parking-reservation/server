import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '@/index';

export const login_route = new Elysia({ prefix: '/login' })
  // GET Users
  .post(
    '/',
    async ({ body, set, jwt }) => {
      console.log('login route');
      console.log('body', body);
      try {
        const { email, password } = body;

        const user = await prisma.users.findFirst({
          where: {
            email,
          },
        });
        if (!user) {
          set.status = 401;
          return { message: 'Wrong username or password', status: 401 };
        }

        const is_password_match = await bcrypt.compare(password, user.password!);
        if (!is_password_match) {
          set.status = 401;
          return { message: 'Wrong username or password', status: 401 };
        }

        //JWT
        const token = await jwt.sign({ id: user.id });
        prisma.$disconnect();
        set.status = 200;
        return { token: token, status: 200, role: user.role };
      } catch (e: any) {
        set.status = 500;
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get('/check_role', async ({ set, auth_user }) => {
    if (!auth_user) {
      set.status = 401;
      return { message: 'Unauthorized', status: 401 };
    }
    set.status = 200;
    return { role: auth_user.role, status: 200 };
  });
