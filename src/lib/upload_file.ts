import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

type upload_file_result =
  | { status: 'error'; message: string }
  | { status: 'success'; url: string };

export const upload_file = async (file: File): Promise<upload_file_result> => {
  if (!process.env.UPLOAD_FOLDER) {
    return {
      status: 'error',
      message: 'Upload folder is not set',
    };
  }

  if (!file.size || file.size === 0) {
    return {
      status: 'error',
      message: 'File is empty',
    };
  }

  if (!file.type.startsWith('image')) {
    return {
      status: 'error',
      message: 'File is not an image',
    };
  }

  if (!['jpg', 'jpeg', 'png'].includes(file.type.split('/')[1])) {
    return {
      status: 'error',
      message: 'Invalid file type',
    };
  }

  const date = new Date();

  const file_name = `${uuidv4()}-${date.getDate()}-${date.getMonth()}.${
    file.type.split('/')[1]
  }`;
  const path = join('.', process.env.UPLOAD_FOLDER!, file_name);
  const url = `/file/${file_name}`;

  await Bun.write(path, file);

  return {
    status: 'success',
    url,
  };
};
