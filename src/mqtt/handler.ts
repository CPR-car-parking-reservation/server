import { update_slot } from '@/lib/parking';
import { recive_mqtt, parking_data, reservation_data } from '@/lib/type';
import { mqtt_client } from '@/mqtt/connect';
import dotenv from 'dotenv';
dotenv.config();

// import { parking_slot_status_mqtt } from '@/lib/type';
import { ParkingStatus, PrismaClient, ReservationStatus } from '@prisma/client';
mqtt_client.on('connect', () => {
  console.log('✅ Connected to Netpie MQTT Broker!');
  mqtt_client.subscribe(`${process.env.MQTT_TOPIC}/cpr/from_board/#`, (err) => {
    if (!err) {
      console.log(`${process.env.MQTT_TOPIC}/cpr/from_board/#`);
    }
  });
});

// mqtt_client.on('message', (topic, message) => {
//   console.log(`📩 Received message: ${message.toString()} from topic: ${topic}`);
// });

// mqtt_client.on('error', (err) => {
//   console.error('❌ MQTT Connection Error:', err);
// });

// setInterval(() => {
//   send_trigger_mobile();
// }, 5000);

// เมื่อเชื่อมต่อสำเร็จ

// // เมื่อได้รับข้อความจาก topic ที่ subscribe ไว้
mqtt_client.on('message', async (topic, message) => {
  console.log(topic);
  try {
    const messageText = message.toString();
    console.log('📩 Received message:', messageText);
    if (messageText === 'first_run') {
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
      });
    } else {
      const obj: recive_mqtt = JSON.parse(messageText);
      Object.keys(obj).forEach(async (key: string) => {
        if (key == 'parking_data') {
          let parking_data = Object.values(obj)[0] as parking_data;
          setImmediate(async () => {
            await update_slot(parking_data);
          });
        } else if (key == 'reservation_data') {
          let reservation_data = Object.values(obj)[0] as unknown as reservation_data;
          const prisma = new PrismaClient();
          //find reservation by id and end_at is null
          const reservation = await prisma.reservations.findUnique({
            where: {
              id: reservation_data.id.trim(),
              end_at: null,
              status: ReservationStatus.WAITING,
            },
          });

          if (reservation) {
            //found reservation and time
            console.log('found reservation and time');
            mqtt_client.publish(`${process.env.MQTT_TOPIC}/cpr/from_server/reservation`, '1');
          } else {
            //not found reservation
            console.log('not found reservation');
            mqtt_client.publish(`${process.env.MQTT_TOPIC}/cpr/from_server/reservation`, '0');
          }
        }
      });
      //check obj name
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
  const publishTopic = `${process.env.MQTT_TOPIC}/cpr/from_server/${floor_number}/${slot_number}`;
  if (status === 'IDLE') {
    mqtt_client.publish(publishTopic, `${floor_number}:${slot_number}:1`);
  } else if (status === 'FULL') {
    mqtt_client.publish(publishTopic, `${floor_number}:${slot_number}:0`);
  } else {
    mqtt_client.publish(publishTopic, `${floor_number}:${slot_number}:2`);
  }
};

export const send_display = async (slot_number: string, license_plate: string) => {
  const publishTopic = `${process.env.MQTT_TOPIC}/cpr/from_server/reservation/display`;
  mqtt_client.publish(publishTopic, `${slot_number}:${license_plate}`);
};

export const send_trigger_mobile = async () => {
  const publishTopic = `${process.env.MQTT_TOPIC}/cpr/from_server/trigger`;
  mqtt_client.publish(publishTopic, 'fetch slot');
};
