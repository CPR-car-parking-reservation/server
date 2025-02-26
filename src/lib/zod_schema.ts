import { z } from 'zod';

// Validation of USER
export const validate_user_create = z
  .object({
    email: z.string().email({ message: 'Invalid email' }),
    password: z.string().min(8, { message: 'Password must be atleast 8 characters long' }),
    confirm_password: z.string().min(8, { message: 'Password must be atleast 8 characters long' }),
    name: z.string().min(3, { message: 'Name cannot be empty' }),
    role: z.enum(['ADMIN', 'USER'], { message: 'Invalid role' }),
    image: z.instanceof(File),
  })
  .refine((data) => data.password == data.confirm_password, {
    message: 'Passwords do not match',
  });

export const validate_login = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  password: z.string(),
});

// Validation of CAR
export const validate_car_create = z.object({
  car_model: z.string().min(1, { message: 'Car model cannot be empty' }),
  car_type: z.string().min(1, { message: 'Car type cannot be empty' }),
  car_number: z.string().min(1, { message: 'Car number cannot be empty' }),
  user_id: z.string({ message: 'Invalid user id' }),
  image: z.instanceof(File),
});

export const validate_car_update = z.object({
  car_model: z.string().min(1, { message: 'Car model cannot be empty' }),
  car_type: z.string().min(1, { message: 'Car type cannot be empty' }),
  car_number: z.string().min(1, { message: 'Car number cannot be empty' }),
  car_id: z.string({ message: 'Invalid car id' }),
});

// Validation of PARKING SLOT
export const validate_create_parking_slot = z.object({
  slot_number: z.string().min(1, { message: 'Slot number cannot be empty' }),
  status: z.enum(['IDLE', 'ACTIVE', 'INACTIVE'], { message: 'Invalid status' }),
  floor_id: z.string().min(1, { message: 'floor id cannot be empty' }),
});

export const validate_update_parking_slot = z.object({
  slot_number: z.string().min(1, { message: 'Slot number cannot be empty' }),
  status: z.enum(['IDLE', 'ACTIVE', 'INACTIVE'], { message: 'Invalid status' }),
  parking_slot_id: z.string({ message: 'Invalid parking slot id' }),
  floor_id: z.string().min(1, { message: 'floor id cannot be empty' }),
});

// Validation of RESERVATION
export const validate_reservation_praking = z.object({
  user_id: z.string({ message: 'Invalid user id' }),
  car_id: z.string({ message: 'Invalid car id' }),
  parking_slot_id: z.string({ message: 'Invalid parking slot id' }),
  start_at: z.coerce.date({ message: 'Invalid start time' }),
});

// Validation of FLOOR
export const validate_create_floor = z.object({
  floor_number: z.string().min(1, { message: 'Floor number cannot be empty' }),
});

export const validate_update_floor = z.object({
  floor_number: z.string().min(1, { message: 'Floor number cannot be empty' }),
});
