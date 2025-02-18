import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { users_route } from '@/route/users';
import { file_route } from '@/route/file_route';
import { cars_route } from '@/route/cars';
import { parking_slots_route } from '@/route/parking_slots';
import swagger from '@elysiajs/swagger';
import { reservation_route } from './route/reserv';
import aedes from 'aedes';
import { createServer } from 'net';

import mqtt from 'mqtt';
import { floor_route } from './route/floor';

// เชื่อมต่อกับ MQTT Broker (เช่น broker.hivemq.com)
const client = mqtt.connect('mqtt://broker.hivemq.com');

// เมื่อเชื่อมต่อสำเร็จ
client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  // Subscribe ไปยัง topic "bun/test"
  client.subscribe('71<42XBR_qz2FAxUJ7Z689)p/cpr/carparking/#', (err) => {
    if (!err) {
      console.log('📡 Subscribed to topic: bun/test');
    }
  });
});

// เมื่อได้รับข้อความจาก topic ที่ subscribe ไว้
client.on('message', (topic, message) => {
  console.log(`📩 Received message: ${message.toString()} from topic: ${topic}`);
});
// สร้าง route สำหรับ /broker
const app = new Elysia()
  .use(
    swagger({
      provider: 'swagger-ui',
    })
  )
  .use(parking_slots_route)
  .use(file_route)
  .use(users_route)
  .use(cars_route)
  .use(reservation_route)
  .use(floor_route)

  .listen(process.env.PORT!);

console.log(`Server running on port ${process.env.PORT}`);
