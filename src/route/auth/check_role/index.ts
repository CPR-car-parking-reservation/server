import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { jwt } from '@elysiajs/jwt';
import bcrypt from 'bcrypt';
import { userAuthMiddleware } from '@/lib/auth';

// export const check_role_route = new Elysia({ prefix: '/login' })
//   .onBeforeHandle(userAuthMiddleware)
//   .post('/check_role', async ({   , set }) => {
//     const { role } = req.body;
//     if (role === 'admin') {
//       return res.json({ message: 'You are an admin' });
//     }
//     return res.json({ message: 'You are not an admin' });
//   });
