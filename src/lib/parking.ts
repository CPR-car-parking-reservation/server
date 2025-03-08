import { ParkingStatus, PrismaClient, ReservationStatus } from '@prisma/client';
import { parking_data } from './type';
import { send_display, send_trigger_mobile } from '@/mqtt/handler';
import { prisma } from '..';

export const update_slot = async (parking: parking_data) => {
  const status = parking.status as ParkingStatus;
  const this_slot = await prisma.parking_slots.findUnique({
    where: {
      slot_number: parking.name.trim(),
      NOT: {
        status: ParkingStatus.MAINTENANCE,
      },
    },
  });

  await prisma.parking_slots.update({
    where: {
      id: this_slot?.id,
    },
    data: {
      status: status,
    },
  });

  const this_reservation = await prisma.reservations.findFirst({
    where: {
      parking_slot_id: this_slot?.id,
      end_at: null,
      OR: [
        {
          status: ReservationStatus.OCCUPIED,
        },
        {
          status: ReservationStatus.WAITING,
        },
      ],
    },
  });
  console.log('this_reservation', this_reservation);
  if (!this_reservation) {
    console.log('Reservation not found');
    return;
  }
  if (status === ParkingStatus.FULL) {
    await prisma.reservations.update({
      where: {
        id: this_reservation.id,
      },
      data: {
        status: ReservationStatus.OCCUPIED,
      },
    });
  }

  if (status === ParkingStatus.IDLE) {
    console.log('🚗 Parking slot is empty');
    const charge_rate = await prisma.setting.findMany();
    const float_charge_rate = charge_rate[0].charge_rate;

    const start_at = this_reservation.created_at;
    if (!start_at) return;
    const end_at = new Date();
    await prisma.reservations.update({
      where: {
        id: this_reservation.id,
      },
      data: {
        end_at: end_at,
        price: await calculate_charge(start_at, end_at, float_charge_rate),
        status: ReservationStatus.SUCCESS,
      },
    });

    send_display(parking.name, '');
  }

  console.log('✅ Sent parking slot status');
  prisma.$disconnect();
  send_trigger_mobile();
};

const calculate_charge = async (start_at: Date, end_at: Date, charge_rate: number) => {
  const diff = end_at.getTime() - start_at.getTime();
  const diff_hour = diff / (1000 * 60 * 60);
  console.log('diff_hour', diff_hour);
  const round = Math.ceil(diff_hour);
  if (round <= 1) {
    return charge_rate;
  }
  console.log('charge_rate', charge_rate);
  const price = Math.round(diff_hour) * charge_rate;
  console.log('price', price);
  return price;
  //   return diff_hour * charge_rate;
};
