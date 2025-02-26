import { Elysia, t } from 'elysia';
import { PrismaClient, Role } from '@prisma/client';
import { validate_user_create } from '@/lib/zod_schema';
import { upload_file } from '@/lib/upload_file';
import bcrypt from 'bcrypt';

export const users_route = new Elysia({ prefix: '/users' })
  // GET Users
  .get('/', async () => {
    try {
      const prisma = new PrismaClient();
      const users = await prisma.users.findMany();
      return { users };
    } catch (e: any) {
      return { message: 'Internal Server Error' };
    }
  })

  // POST Create User
  .post(
    '/',
    async ({ body }) => {
      try {
        const { email, password, confirm_password, name, role, image } = body;

        const validate = validate_user_create.safeParse(body);

        //console.log(validate);

        if (!validate.success) {
          return { message: validate.error.issues[0].message };
        }

        const upload_result = await upload_file(body.image);
        if (upload_result.status === 'error') {
          return { message: upload_result.message };
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
            role: role as Role,
            image_url: upload_result.url as string,
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
        role: t.String(),
        image: t.File(),
      }),
    }
  );

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
