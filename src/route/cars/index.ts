import { PrismaClient } from '@prisma/client';
import { t, Elysia } from 'elysia';
import { validate_car_create, validate_car_update } from '@/lib/zod_schema';
import { upload_file } from '@/lib/upload_file';
import { middleware } from '@/lib/auth';
const prisma = new PrismaClient();

export const cars_route = new Elysia({ prefix: '/cars' })
  .use(middleware)
  .get('/', async ({ set, auth_user }) => {
    if (!auth_user) {
      set.status = 401;
      return { message: 'Unauthorized', status: 401 };
    }
    try {
      const cars = await prisma.cars.findMany();
      set.status = 200;
      return { data: cars, status: 200 };
    } catch (e: any) {
      set.status = 400;
      return { message: 'Internal Server Error' };
    }
  })
  //GET car by car id
  .get(
    '/id/:car_id',
    async ({ params: { car_id }, set, auth_user }) => {
      if (!auth_user) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        const car = await prisma.cars.findUnique({
          where: {
            id: car_id,
          },
        });

        if (!car) {
          return { message: 'Car not found', status: 400 };
        }
        set.status = 200;
        //return { data: [car], status: 200 };
        return { data: car, status: 200 };
      } catch (e: any) {
        set.status = 400;
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
    '/user/:user_id',
    async ({ auth_user, set, params }) => {
      console.log('auth_user in carsss', auth_user);
      if (!auth_user) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        const { user_id } = params;
        const cars = await prisma.cars.findMany({
          where: {
            user_id: user_id,
          },
        });
        set.status = 200;
        return { data: cars, status: 200 };
      } catch (e: any) {
        set.status = 400;
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
    async ({ body, auth_user, set }) => {
      if (!auth_user) {
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        const { license_plate, car_model, car_type } = body;
        const validate = validate_car_create.safeParse(body);

        if (!validate.success) {
          set.status = 400;
          return { message: validate.error.issues[0].message, status: 400 };
        }
        console.log(body);

        const is_user_exit = await prisma.users.findUnique({
          where: {
            id: auth_user.id,
          },
        });

        if (!is_user_exit) {
          set.status = 400;
          return { message: 'User not found', status: 400 };
        }

        const upload_result = await upload_file(body.image);
        if (upload_result.status === 'error') {
          set.status = 400;
          return { message: upload_result.message, status: 400 };
        }

        const is_license_plate = await prisma.cars.findFirst({
          where: {
            license_plate,
          },
        });

        if (is_license_plate) {
          set.status = 400;
          return {
            message: 'Car license plate already exits',
            status: 400,
          };
        }

        const new_car = await prisma.cars.create({
          data: {
            license_plate,
            car_model,
            car_type,
            user_id: auth_user.id,
            image_url: upload_result.url as string,
          },
        });

        console.log(new_car);
        set.status = 200;
        return {
          data: new_car,
          message: 'Car created successfully',
          status: 200,
        };
      } catch (e: any) {
        set.status = 400;
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        license_plate: t.String(),
        car_model: t.String(),
        car_type: t.String(),
        image: t.File(),
      }),
    }
  )

  .put(
    '/id/:car_id',
    async ({ body, params, auth_user, set }) => {
      if (!auth_user) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        console.log('body', body);
        console.log('params', params);

        const { car_id } = await params;
        const { license_plate, car_model, car_type } = body;
        const validate = validate_car_update.safeParse(body);

        const this_car = await prisma.cars.findFirst({
          where: {
            id: car_id,
          },
        });

        if (!this_car) {
          set.status = 400;
          return { message: 'Car not found', status: 400 };
        }

        if (!validate.success) {
          set.status = 400;
          return { message: validate.error.issues[0].message, status: 400 };
        }

        const is_license_plate = await prisma.cars.findFirst({
          where: {
            license_plate,
            id: {
              not: car_id,
            },
          },
        });

        if (is_license_plate) {
          set.status = 400;
          return {
            message: 'Car license plate already exits',
            status: 400,
          };
        }

        if (body.image === null || body.image === undefined) {
          const new_car = await prisma.cars.update({
            where: {
              id: car_id,
            },
            data: {
              license_plate,
              car_model,
              car_type,
            },
          });
          set.status = 200;
          return { message: 'Car updated successfully', data: new_car, status: 200 };
        }

        const upload_result = await upload_file(body.image);
        if (upload_result.status === 'error') {
          set.status = 400;
          return { message: upload_result.message, status: 400 };
        }

        const updated_car = await prisma.cars.update({
          where: {
            id: car_id,
          },
          data: {
            license_plate,
            car_model,
            car_type,
            image_url: upload_result ? upload_result.url : this_car.image_url,
          },
        });
        set.status = 200;
        return { message: 'Car updated successfully', data: updated_car, status: 200 };
      } catch (e: any) {
        set.status = 400;
        return { message: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        license_plate: t.String(),
        car_model: t.String(),
        car_type: t.String(),
        image: t.Optional(t.File()),
      }),
      params: t.Object({
        car_id: t.String(),
      }),
    }
  )
  .delete(
    '/id/:car_id',
    async ({ params, auth_user, set }) => {
      if (!auth_user) {
        set.status = 401;
        return { message: 'Unauthorized', status: 401 };
      }
      try {
        const { car_id } = await params;
        const car = await prisma.cars.findUnique({
          where: {
            id: car_id,
          },
        });

        //console.log(car);

        if (!car) {
          set.status = 400;
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
        set.status = 200;
        return {
          message: 'Car deleted successfully',
          status: 200,
        };
      } catch (e: any) {
        set.status = 400;
        return { message: 'Internal Server Error' };
      }
    },
    {
      params: t.Object({
        car_id: t.String(),
      }),
    }
  );
