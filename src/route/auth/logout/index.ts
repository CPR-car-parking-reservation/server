import { Elysia, t } from 'elysia';

export const logout_route = new Elysia({ prefix: '/logout' }).post(
  '/',
  async ({ body, set, jwt }) => {
    //logout
    return { token: null, status: 200, role: null };
  }
);
