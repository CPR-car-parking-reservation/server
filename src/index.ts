import { Elysia } from "elysia";
import { PrismaClient } from "@prisma/client";
import { users_route } from "./users/users_route";
import { z } from "zod";


const app = new Elysia()

.use(users_route)
.onError(({ error, code }) => { 
    console.log("Error: ", error, code);
    return { message: "Internal server error" };
}) 
.listen(process.env.PORT!);


console.log(`Server running on port ${process.env.PORT}`);
