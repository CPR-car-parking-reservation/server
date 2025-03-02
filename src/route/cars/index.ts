import { PrismaClient } from '@prisma/client';
import { t, Elysia } from 'elysia';
import { validate_car_create, validate_car_update } from '@/lib/zod_schema';
import { upload_file } from '@/lib/upload_file';

export const cars_route = new Elysia({ prefix: '/cars' })
  //add return type to swagger
  .get('/', async () => {
    try {
      const prisma = new PrismaClient();
      const cars = await prisma.cars.findMany();
      return { data: cars, status: 200 };
    } catch (e: any) {
      return { message: 'Internal Server Error' };
    }
  })
  //GET car by car id
  .get(
    '/id/:car_id',
    async ({ params: { car_id } }) => {
      try {
        const prisma = new PrismaClient();
        const car = await prisma.cars.findUnique({
          where: {
            id: car_id,
          },
        });

        if (!car) {
          return { message: 'Car not found', status: 400 };
        }

        return { data: [car], status: 200 };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      params: t.Object({
        car_id: t.String(),
      }),
    }
  )
  //GET car by user id
  .get(
    '/get_cars_by_user_id/:user_id',
    async ({ params }) => {
      try {
        const prisma = new PrismaClient();
        const { user_id } = params;
        const cars = await prisma.cars.findMany({
          where: {
            user_id,
          },
        });

        return { data: cars, status: 200 };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      params: t.Object({
        user_id: t.String(),
      }),
    }
  )

  .post(
    '/',
    async ({ body }) => {
      try {
        const { car_number, car_model, car_type, user_id } = body;
        const validate = validate_car_create.safeParse(body);

        if (!validate.success) {
          return { message: validate.error.issues[0].message };
        }
        console.log(body);

        const prisma = new PrismaClient();
        const is_user_exit = await prisma.users.findUnique({
          where: {
            id: user_id,
          },
        });

        if (!is_user_exit) {
          return { message: 'User not found', status: 400 };
        }

        const upload_result = await upload_file(body.image);
        if (upload_result.status === 'error') {
          return { message: upload_result.message };
        }

        const is_car_number = await prisma.cars.findFirst({
          where: {
            car_number,
          },
        });

        if (is_car_number) {
          return {
            message: 'Car number already exits',
            status: 400,
          };
        }

        const new_car = await prisma.cars.create({
          data: {
            car_number,
            car_model,
            car_type,
            user_id,
            image_url: upload_result.url as string,
          },
        });

        console.log(new_car);
        return {
          data: new_car,
          message: 'Car created successfully',
          status: 200,
        };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        car_number: t.String(),
        car_model: t.String(),
        car_type: t.String(),
        user_id: t.String(),
        image: t.File(),
      }),
    }
  )

  .put(
    '/id/:car_id',
    async ({ body, params }) => {
      try {
        console.log('body', body);
        console.log('params', params);
        const prisma = new PrismaClient();
        const { car_id } = await params;
        const { car_number, car_model, car_type } = body;
        const validate = validate_car_update.safeParse(body);

        const this_car = await prisma.cars.findFirst({
          where: {
            id: car_id,
          },
        });

        if (!this_car) {
          return { message: 'Car not found', status: 400 };
        }

        if (!validate.success) {
          return { message: validate.error.issues[0].message, status: 400 };
        }

        if (body.image === null || body.image === undefined) {
          const new_car = await prisma.cars.update({
            where: {
              id: car_id,
            },
            data: {
              car_number,
              car_model,
              car_type,
            },
          });
          return { message: 'Car updated successfully', data: new_car, status: 200 };
        }

        const upload_result = await upload_file(body.image);
        if (upload_result.status === 'error') {
          return { message: upload_result.message };
        }

        const updated_car = await prisma.cars.update({
          where: {
            id: car_id,
          },
          data: {
            car_number,
            car_model,
            car_type,
            image_url: upload_result ? upload_result.url : this_car.image_url,
          },
        });

        return { message: 'Car updated successfully', data: updated_car, status: 200 };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        car_number: t.String(),
        car_model: t.String(),
        car_type: t.String(),
        image: t.Optional(t.File()),
        // image: t.File() || t.Null(),
      }),
      params: t.Object({
        car_id: t.String(),
      }),
    }
  )
  .delete(
    '/id/:car_id',
    async ({ params }) => {
      try {
        const prisma = new PrismaClient();
        const { car_id } = await params;
        const car = await prisma.cars.findUnique({
          where: {
            id: car_id,
          },
        });

        //console.log(car);

        if (!car) {
          return {
            message: 'Car not found',
            status: 400,
          };
        }

        await prisma.cars.delete({
          where: {
            id: car_id,
          },
        });

        return {
          message: 'Car deleted successfully',
          status: 200,
        };
      } catch (e: any) {
        return { message: 'Internal Server Error' };
      }
    },
    {
      params: t.Object({
        car_id: t.String(),
      }),
    }
  );
