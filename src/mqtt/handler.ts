import { recive_mqtt, parking_data, reservation_data } from '@/lib/type';
import { mqtt_client } from '@/mqtt/connect';
// import { parking_slot_status_mqtt } from '@/lib/type';
import { ParkingStatus, PrismaClient } from '@prisma/client';
// เมื่อเชื่อมต่อสำเร็จ
mqtt_client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  // Subscribe ไปยัง topic "bun/test"
  mqtt_client.subscribe('71<42XBR_qz2FAxUJ7Z689)p/cpr/from_board/#', (err) => {
    if (!err) {
      console.log('📡 Subscribed to topic: /cpr/from_board/#');
    }
  });
});

// เมื่อได้รับข้อความจาก topic ที่ subscribe ไว้
mqtt_client.on('message', async (topic, message) => {
  try {
    const messageText = message.toString();

    if (messageText === 'first_run') {
      // ✅ ใช้ setImmediate เพื่อให้ไม่บล็อก event loop
      setImmediate(async () => {
        const prisma = new PrismaClient();
        const parking_slots = await prisma.parking_slots.findMany({
          include: {
            floor: true,
          },
        });

        for (const slot of parking_slots) {
          const publishTopic = `71<42XBR_qz2FAxUJ7Z689)p/cpr/from_server/${slot.floor.floor_number}/${slot.slot_number}`;
          if (slot.status === 'IDLE') {
            mqtt_client.publish(publishTopic, `${slot.floor.floor_number}:${slot.slot_number}:1`);
          } else if (slot.status === 'FULL') {
            mqtt_client.publish(publishTopic, `${slot.floor.floor_number}:${slot.slot_number}:0`);
          } else {
            mqtt_client.publish(publishTopic, `${slot.floor.floor_number}:${slot.slot_number}:2`);
          }

          //   mqtt_client.publish(publishTopic, 'IDLE');
        }

        console.log('✅ Sent parking slot status');
      });
    } else {
      console.log('📩 Received message:', messageText);
      const obj: recive_mqtt = JSON.parse(messageText);
      Object.keys(obj).forEach(async (key: string) => {
        if (key == 'parking_data') {
          let parking_data = Object.values(obj)[0] as parking_data;
          setImmediate(async () => {
            const prisma = new PrismaClient();

            const parking_slots = await prisma.parking_slots.update({
              where: {
                slot_number: parking_data.name.trim(),
              },
              data: {
                status: parking_data.status as ParkingStatus,
              },
            });

            // console.log('✅ Sent parking slot status');
          });
        } else if (key == 'reservation_data') {
          let reservation_data = Object.values(obj)[0] as unknown as reservation_data;
          const prisma = new PrismaClient();
          //find reservation by id and end_at is null
          const reservation = await prisma.reservations.findUnique({
            where: {
              id: reservation_data.id.trim(),
              end_at: null,
            },
          });

          if (reservation) {
            //found reservation and time
            console.log('found reservation and time');
            mqtt_client.publish('71<42XBR_qz2FAxUJ7Z689)p/cpr/from_server/reservation', '1');
          } else {
            //not found reservation
            console.log('not found reservation');
            mqtt_client.publish('71<42XBR_qz2FAxUJ7Z689)p/cpr/from_server/reservation', '0');
          }
        }
      });
      //check obj name
    }
  } catch (error) {
    console.error('❌ Error handling MQTT message:', error);
  }
});
