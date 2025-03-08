import { Elysia, t } from 'elysia';
import { PrismaClient, Role } from '@prisma/client';
import { middleware } from '@/lib/auth';
import { validate_reset_password, validate_user_update } from '@/lib/zod_schema';
import { upload_file } from '@/lib/upload_file';
import bcrypt from 'bcrypt';
import { prisma } from '@/index';

export const users_route = new Elysia({ prefix: '/profile' })
  .use(middleware)

  .get('/', async ({ set, request, auth_user }) => {
    try {
      if (!auth_user) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }

      const user = await prisma.users.findUnique({
        omit: {
          password: true,
        },
        where: {
          id: auth_user.id,
        },
      });
      if (!user) {
        set.status = 404;
        return { message: 'User not found', status: 404 };
      }
      set.status = 200;
      prisma.$disconnect();
      return { data: user, status: 200 };
    } catch (e: any) {
      return { message: 'Internal Server Error' };
    }
  })
  .get('/cars', async ({ set, request, auth_user }) => {
    try {
      if (!auth_user) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }

      const user = await prisma.users.findUnique({
        include: { car: true },
        omit: {
          password: true,
        },
        where: {
          id: auth_user.id,
        },
      });
      if (!user) {
        set.status = 404;
        return { message: 'User not found', status: 404 };
      }
      set.status = 200;
      prisma.$disconnect();
      return { data: user, status: 200 };
    } catch (e: any) {
      return { message: 'Internal Server Error' };
    }
  })
  .put(
    '/',
    async ({ body, set, auth_user }) => {
      try {
        if (!auth_user) {
          set.status = 401;
          return { message: 'Unauthorized', status: 401 };
        }

        const this_user = await prisma.users.findUnique({
          where: {
            id: auth_user.id,
          },
        });

        if (!this_user) {
          set.status = 404;
          return { message: 'User not found', status: 404 };
        }

        const { name, surname, image, phone } = body;
        const validate = validate_user_update.safeParse(body);
        if (!validate.success) {
          set.status = 400;
          return { message: validate.error.issues[0].message, status: 400 };
        }

        const is_phone_exist = await prisma.users.findFirst({
          where: {
            phone,
            id: {
              not: auth_user.id,
            },
          },
        });

        if (is_phone_exist) {
          set.status = 400;
          return { message: 'Phone number already exist', status: 400 };
        }

        if (body.image == null || body.image == undefined) {
          const update_user = await prisma.users.update({
            where: {
              id: auth_user.id,
            },
            data: {
              name,
              surname,
              phone,
            },
          });
          set.status = 200;
          prisma.$disconnect();
          return { data: update_user, message: 'User updated successfully', status: 200 };
        }

        const upload_result = await upload_file(body.image);
        if (upload_result.status === 'error') {
          return { message: upload_result.message };
        }

        const update_user = await prisma.users.update({
          where: {
            id: auth_user.id,
          },
          data: {
            name,
            surname,
            phone,
            image_url: upload_result ? upload_result.url : this_user.image_url,
          },
        });
        set.status = 200;
        return { data: update_user, message: 'User updated successfully', status: 200 };
      } catch (e: any) {
        set.status = 500;
        return { message: 'Internal Server Error', status: 500 };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        surname: t.String(),
        phone: t.String(),
        image: t.Optional(t.File()),
      }),
    }
  )
  .put(
    '/reset_password',
    async ({ set, auth_user, body }) => {
      console.log('auth_user resettt', auth_user);
      try {
        if (!auth_user) {
          set.status = 401;
          return { message: 'Unauthorized', status: 401 };
        }

        const user = await prisma.users.findUnique({
          where: {
            id: auth_user.id,
          },
        });
        if (!user) {
          set.status = 404;
          return { message: 'User not found', status: 404 };
        }

        const validate = validate_reset_password.safeParse(body);
        if (!validate.success) {
          set.status = 400;
          return { message: validate.error.issues[0].message, status: 400 };
        }

        const is_password_match = await bcrypt.compare(body.old_password, user?.password!);
        if (!is_password_match) {
          set.status = 400;
          return { message: 'Old password is incorrect', status: 400 };
        }

        const hashed_password = await bcrypt.hash(body.new_password, 10);
        const updated_user = await prisma.users.update({
          where: {
            id: auth_user.id,
          },
          data: {
            password: hashed_password,
          },
        });

        set.status = 200;
        prisma.$disconnect();
        return { message: 'Password reset successfully', status: 200 };
      } catch (e: any) {
        set.status = 500;
        return { message: 'Internal Server Error', status: 500 };
      }
    },
    {
      body: t.Object({
        old_password: t.String(),
        new_password: t.String(),
        confirm_password: t.String(),
      }),
    }
  );
