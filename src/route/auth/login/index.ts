import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { jwt } from '@elysiajs/jwt';
import bcrypt from 'bcrypt';

export const login_route = new Elysia({ prefix: '/login' })
  // GET Users
  .post(
    '/',
    async ({ body, set, jwt }) => {
      try {
        const prisma = new PrismaClient();
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
        console.log('token', token);
        return { token: token, status: 200, role: user.role };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  );
