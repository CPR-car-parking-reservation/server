import mqtt from 'mqtt';
// var options = {
//   host: process.env.MQTT_HOST,
//   port: process.env.MQTT_PORT ? parseInt(process.env.MQTT_PORT) : undefined,
//   protocol: 'mqtts' as 'mqtts',
//   username: process.env.MQTT_USERNAME,
//   password: process.env.MQTT_PASSWORD,
// };

export const mqtt_client = mqtt.connect('mqtt://broker.hivemq.com');
