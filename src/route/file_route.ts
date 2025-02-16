import Elysia from 'elysia';
import { join } from 'path';

export const file_route = new Elysia({ prefix: '/file' }).get(
  '/:id',
  async ({ params, set }) => {
    const { id } = params;
    const path = join('.', process.env.UPLOAD_FOLDER!, id);

    const fileContent = Bun.file(path);

    set.headers['content-type'] = fileContent.type;
    return fileContent;
  }
);
