import { Elysia, t } from "elysia";
import { PrismaClient, Role } from "@prisma/client";
import { z} from "zod";
import { validate_user_create } from "../lib/zod_schema";

export const users_route = new Elysia({ prefix: "/users" })
  .get("/", async () => {
    const prisma = new PrismaClient();
    const users = await prisma.users.findMany();
    return { users };
  })
  .get(
    "/get_name_role",
    async ({ query }) => {
      const prisma = new PrismaClient();
      const { name, role } = query;

      const user = await prisma.users.findFirst({
        where: {
          name: name,
          role: role as Role,
        },
      });

      if(!user) {
        return { message: "User not found" };
      }

      return { user };
    },
    {
      query: t.Object({
        name: t.String(),
        role: t.String(),
      }),
    }
  )
  .post("/", async ({ body }) => {
    const { email, password, confirm_password, name, role } = body;

    const validate = validate_user_create.safeParse(body);

    if(!validate.success) {
      return { message: validate.error.issues[0].message };
    }

    const prisma = new PrismaClient();
    const user = await prisma.users.create({
      data: {
        email,
        password,
        name,
        role: role as Role,
      },
    });

    return { data : user  , message: "User created successfully" , status : 200 }; 
  },{
    body: t.Object({
        email : t.String(),
        password : t.String(),
        confirm_password : t.String(),
        name : t.String(),
        role : t.String(),
    })
  })
