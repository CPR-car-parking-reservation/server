import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { validate_user_create } from '@/lib/zod_schema';
import { upload_file } from '@/lib/upload_file';
import bcrypt from 'bcrypt';
import { send_trigger_mobile_admin } from '@/mqtt/handler';
import { prisma } from '@/index';

export const register_route = new Elysia({ prefix: '/register' }).post(
  '/',
  async ({ body, set }) => {
    try {
      const { email, password, confirm_password, surname, name, phone } = body;
      const validate = validate_user_create.safeParse(body);

      if (!validate.success) {
        set.status = 400;
        return { message: validate.error.issues[0].message };
      }
      const hashed_password = await bcrypt.hash(password, 10);

      const is_user_exist = await prisma.users.findFirst({
        where: {
          email,
        },
      });
      if (is_user_exist) {
        set.status = 400;
        return { message: 'User already exist' };
      }

      const is_phone_exist = await prisma.users.findFirst({
        where: {
          phone,
        },
      });

      if (is_phone_exist) {
        set.status = 400;
        return { message: 'Phone number already exist' };
      }

      const new_user = await prisma.users.create({
        data: {
          email,
          password: hashed_password,
          name,
          phone,
          surname,
          image_url: '/file/account-default.png',
        },
      });

      set.status = 200;
      send_trigger_mobile_admin('fetch user');
      prisma.$disconnect();
      return {
        data: new_user,
        message: 'Register successfully',
        status: 200,
      };
    } catch (e: any) {
      set.status = 400;
      return { message: 'Internal Server Error' };
    }
  },
  {
    body: t.Object({
      email: t.String(),
      password: t.String(),
      confirm_password: t.String(),
      name: t.String(),
      surname: t.String(),
      phone: t.String(),
    }),
  }
);
