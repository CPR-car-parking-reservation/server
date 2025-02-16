// import Elysia from "elysia";
// import { PrismaClient } from "@prisma/client";

// export const cars_route = new Elysia({ prefix: "/cars" })
//     .get("/", async () => {
//         const prisma = new PrismaClient();
//         const cars = await prisma.cars.findMany();
//         return { cars };
//     })

//     .post("/", async ({ body }) => {
//         const { car_model , car } = body;
//     })
