import Elysia from "elysia";
import { PrismaClient } from "@prisma/client";
import { t } from "elysia";
import { validate_car_create, validate_car_update } from "@/lib/zod_schema";

export const cars_route = new Elysia({ prefix: "/cars" })
  .get("/", async () => {
    const prisma = new PrismaClient();
    const cars = await prisma.cars.findMany();
    return { cars };

  })

  .post(
    "/",
    async ({ body }) => {
      const { car_number, car_model, car_type, user_id } = body;
      const validate = validate_car_create.safeParse(body);

      if (!validate.success) {
        return { message: validate.error.issues[0].message };
      }

      const prisma = new PrismaClient();
      const is_user_exit = await prisma.users.findFirst({
        where: {
          id: user_id,
        },
      });

      if (!is_user_exit) {
        return { message: "User not found", status: 400 };
      }

      const new_car = await prisma.cars.create({
        data: {
          car_number,
          car_model,
          car_type,
          user_id,
        },
      });

      return {
        data: new_car,
        message: "Car created successfully",
        status: 200,
      };
    },
    {
      body: t.Object({
        car_number: t.String(),
        car_model: t.String(),
        car_type: t.String(),
        user_id: t.String(),
      }),
    }
  )

  .put(
    "/",
    async ({ body }) => {
      const prisma = new PrismaClient();
      const { car_number, car_model, car_type, car_id } = body;
      const validate = validate_car_update.safeParse(body);

      const this_car = await prisma.cars.findFirst({
        where: {
          id: car_id,
        },
      });

      if (!this_car) {
        return { message: "Car not found", status: 400 };
      }

      const updated_car = await prisma.cars.update({
        where: {
          id: car_id,
        },
        data: {
          car_number,
          car_model,
          car_type,
        },
      });

      return { massage: "Car updated successfully", status: 200 };
    },
    {
      body: t.Object({
        car_number: t.String(),
        car_model: t.String(),
        car_type: t.String(),
        car_id: t.String(),
      }),
    }
  )
  .delete(
    "/id/:car_id",
    async ({ params }) => {
      const prisma = new PrismaClient();
      const { car_id } = await params;
      const car = await prisma.cars.findUnique({
        where: {
          id: car_id,
        },
      });

      console.log(car);

      if (!car) {
        return {
          message: "Car not found",
          status: 400,
        };
      }

      await prisma.cars.delete({
        where: {
          id: car_id,
        },
      });

      return {
        message: "Car deleted successfully",
        status: 200,
      };
    },
    {
      params: t.Object({
        car_id: t.String(),
      }),
    }
  );
