import { z } from 'zod';

// Validation of USER
export const validate_user_create = z
  .object({
    email: z.string({ message: 'Invalid email' }).email(),
    password: z.string({ message: 'Password must be at least 8 characters long' }).min(8),
    confirm_password: z.string({ message: 'Password must be at least 8 characters long' }).min(8),
    name: z.string({ message: 'Name cannot be empty' }),
    phone: z.string().regex(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits long' }),
    surname: z.string({ message: 'Surname cannot be empty' }),
  })
  .refine((data) => data.password == data.confirm_password, {
    message: 'Passwords do not match',
  });

export const validate_login = z.object({
  email: z.string({ message: 'Invalid email' }).email(),
  password: z.string(),
});

export const validate_user_update = z.object({
  name: z.string({ message: 'Name cannot be empty' }),
  surname: z.string({ message: 'Surname cannot be empty' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits long' }),
  image: z.instanceof(File).optional(),
});

export const validate_reset_password = z
  .object({
    old_password: z.string({ message: 'Password must be at least 8 characters long' }).min(8),
    new_password: z.string({ message: 'Password must be at least 8 characters long' }).min(8),
    confirm_password: z.string({ message: 'Password must be at least 8 characters long' }).min(8),
  })
  .refine((data) => data.new_password == data.confirm_password, {
    message: 'Passwords do not match',
  });

// Validation of CAR
export const validate_car_create = z.object({
  car_model: z.string({ message: 'Car model cannot be empty' }),
  car_type: z.string({ message: 'Car type cannot be empty' }),
  license_plate: z.string({ message: 'Car license plate cannot be empty' }),
  image: z.instanceof(File),
});

export const validate_car_update = z.object({
  car_model: z.string({ message: 'Car model cannot be empty' }),
  car_type: z.string({ message: 'Car type cannot be empty' }),
  license_plate: z.string({ message: 'Car license plate cannot be empty' }),
  image: z.instanceof(File).optional(),
});

// Validation of PARKING SLOT
export const validate_create_parking_slot = z.object({
  slot_number: z.string({ message: 'Slot number cannot be empty' }),
  floor_number: z.string({ message: 'Floor number cannot be empty' }),
});

export const validate_get_parking_slot = z.object({
  slot_number: z.string().optional(),
  floor_id: z.string().optional(),
  status: z.enum(['IDLE', 'FULL', 'RESERVED', 'MAINTENANCE']).optional(),
});

export const validate_update_parking_slot = z.object({
  slot_number: z.string({ message: 'Slot number cannot be empty' }),
  floor_number: z.string({ message: 'Floor number cannot be empty' }),
  status: z.enum(['IDLE', 'FULL', 'RESERVED', 'MAINTENANCE', 'AVAILABLE']).optional(),
});

// Validation of RESERVATION
export const validate_reservation_praking = z.object({
  car_id: z.string({ message: 'Invalid car id' }),
  parking_slot_id: z.string({ message: 'Invalid parking slot id' }),
});

// Validation of FLOOR
export const validate_create_floor = z.object({
  floor_number: z.string({ message: 'Floor number cannot be empty' }),
});

export const validate_update_floor = z.object({
  floor_number: z.string({ message: 'Floor number cannot be empty' }),
});
