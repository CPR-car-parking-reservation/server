import Elysia from "elysia";
import { PrismaClient } from "@prisma/client";
import { t } from "elysia";
import { validate_car_create, validate_car_update } from "@/lib/zod_schema";

export const parking_slots_route = new Elysia({ prefix: "/parking_slots" }).post(
  "/",
  async ({ body }) => {
    console.log("get data");
    const { dis_A1, dis_A2, dis_A3, dis_A4, dis_A5, dis_A6 } = body;

    const prisma = new PrismaClient();
    await prisma.parking_slots.update({
      where: {
        id: "e3d3b6d4-10ef-4150-b43e-a9b9dcd8fe60",
      },
      data: {
        sensor_dist: dis_A1,
      },
    });

    await prisma.parking_slots.update({
      where: {
        id: "0383f2bf-4780-47aa-9aa2-55ffbb22cd32",
      },
      data: {
        sensor_dist: dis_A2,
      },
    });

    return {
      data: "success",
      status: 200,
    };
  },
  {
    body: t.Object({
      dis_A1: t.Number(),
      dis_A2: t.Number(),
      dis_A3: t.Number(),
      dis_A4: t.Number(),
      dis_A5: t.Number(),
      dis_A6: t.Number(),
    }),
  }
);
