import { update_slot } from '@/lib/parking';
import { parking_data, reservation_data } from '@/lib/type';
import { mqtt_client } from '@/mqtt/connect';
import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient, ReservationStatus } from '@prisma/client';

mqtt_client.on('connect', () => {
  console.log('✅ Connected to MQTT Broker!');
  mqtt_client.subscribe(`cpr/from_board/#`, (err) => {
    if (!err) {
      console.log(`cpr/from_board/#`);
    }
  });
});

mqtt_client.on('message', async (topic, message) => {
  try {
    const messageText = message.toString();
    const topicText = topic.toString();
    console.log('🔝 topicText', topicText);
    const obj: any = JSON.parse(messageText);
    console.log('recive_obj', obj);

    if (topicText.startsWith('cpr/from_board/slot')) {
      Object.keys(obj).forEach(async (key: string) => {
        let parking_data = Object.values(obj)[0] as parking_data;
        setImmediate(async () => {
          await update_slot(parking_data);
        });
      });
    } else if (topicText.startsWith('cpr/from_board/setup')) {
      setImmediate(async () => {
        const prisma = new PrismaClient();
        const parking_slots = await prisma.parking_slots.findMany({
          include: {
            floor: true,
          },
        });

        for (const slot of parking_slots) {
          send_slot_status_to_board(slot.slot_number, slot.floor.floor_number, slot.status);
        }
        prisma.$disconnect();
      });
    } else if (topicText.startsWith('cpr/from_board/reservation')) {
      let reservation_data = Object.values(obj)[0] as unknown as reservation_data;
      const prisma = new PrismaClient();
      const reservation = await prisma.reservations.findUnique({
        where: {
          id: reservation_data.id.trim(),
          end_at: null,
          status: ReservationStatus.WAITING,
        },
      });

      if (reservation) {
        console.log('found reservation and time');
        mqtt_client.publish(`cpr/from_server/reservation`, '1');
      } else {
        console.log('not found reservation');
        mqtt_client.publish(`cpr/from_server/reservation`, '0');
      }
      prisma.$disconnect();
    }
  } catch (error) {
    console.error('❌ Error handling MQTT message:', error);
  }
});

export const send_slot_status_to_board = async (
  slot_number: string,
  floor_number: string,
  status: string
) => {
  const publishTopic = `cpr/from_server/${floor_number}/${slot_number}`;
  if (status === 'IDLE') {
    mqtt_client.publish(publishTopic, `${floor_number}:${slot_number}:1`);
  } else if (status === 'FULL') {
    mqtt_client.publish(publishTopic, `${floor_number}:${slot_number}:0`);
  } else if (status === 'RESERVED') {
    mqtt_client.publish(publishTopic, `${floor_number}:${slot_number}:2`);
  } else {
    mqtt_client.publish(publishTopic, `${floor_number}:${slot_number}:3`);
  }
};

export const send_display = async (slot_number: string, license_plate: string) => {
  const publishTopic = `cpr/from_server/reservation/display`;
  mqtt_client.publish(publishTopic, `${slot_number}:${license_plate}`);
};

export const send_trigger_mobile = async () => {
  const publishTopic = `cpr/from_server/trigger/user`;
  mqtt_client.publish(publishTopic, 'fetch slot');
};

export const send_trigger_mobile_admin = async (content: string) => {
  const publishTopic = `cpr/from_server/trigger/admin`;
  mqtt_client.publish(publishTopic, content);
};
