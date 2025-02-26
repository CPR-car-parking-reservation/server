import mqtt from 'mqtt';
export const mqtt_client = mqtt.connect('mqtt://broker.hivemq.com');
