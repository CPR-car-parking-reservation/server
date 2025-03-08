import { Elysia, t } from 'elysia';
import { PrismaClient, Role } from '@prisma/client';
import { Context } from 'elysia';
import { prisma } from '..';

export const middleware = new Elysia().derive(
  { as: 'scoped' },
  async ({
    jwt,
    headers,
    set,
  }: Context): Promise<{
    auth_user: { id: string; role: Role } | null;
  }> => {
    const token = headers.authorization?.split(' ')[1];
    const auth_user = await jwt.verify(token!, process.env.JWT_SECRET!);
    if (!auth_user) {
      set.status = 401;
      return { auth_user: null };
    }

    const user = await prisma.users.findFirst({
      where: {
        id: auth_user.id,
      },
    });
    return {
      auth_user: {
        id: user?.id!,
        role: user?.role!,
      },
    };
  }
);
