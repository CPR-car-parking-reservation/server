import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { validate_user_create } from '@/lib/zod_schema';
import { upload_file } from '@/lib/upload_file';
import bcrypt from 'bcrypt';

export const register_route = new Elysia({ prefix: '/register' }).post(
  '/',
  async ({ body }) => {
    try {
      const { email, password, confirm_password, name } = body;
      const validate = validate_user_create.safeParse(body);

      //console.log(validate);

      if (!validate.success) {
        return { message: validate.error.issues[0].message };
      }
      const hashed_password = await bcrypt.hash(password, 10);

      const prisma = new PrismaClient();
      const is_user_exist = await prisma.users.findFirst({
        where: {
          email,
        },
      });
      if (is_user_exist) {
        return { message: 'User already exist' };
      }

      const new_user = await prisma.users.create({
        data: {
          email,
          password: hashed_password,
          name,

          image_url: '/file/account-default.png',
        },
      });

      return {
        data: new_user,
        message: 'User created successfully',
        status: 200,
      };
    } catch (e: any) {
      return { message: 'Internal Server Error' };
    }
  },
  {
    body: t.Object({
      email: t.String(),
      password: t.String(),
      confirm_password: t.String(),
      name: t.String(),
    }),
  }
);
