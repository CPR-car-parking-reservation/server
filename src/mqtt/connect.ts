import mqtt from 'mqtt';
import { MqttProtocol } from 'mqtt';

const options: mqtt.IClientOptions = {
  host: process.env.MQTT_HOST,
  port: process.env.MQTT_PORT ? parseInt(process.env.MQTT_PORT) : undefined,
  protocol: 'mqtts' as MqttProtocol,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

export const mqtt_client = mqtt.connect(options);
