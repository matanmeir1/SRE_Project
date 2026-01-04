const { Kafka } = require('kafkajs');
const logger = require('./logger');

const kafka = new Kafka({
  clientId: 'sre-consumer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'sre-consumer-group' });

async function run() {
  try {
    await consumer.connect();
    console.log('Connected to Kafka');

    await consumer.subscribe({ topic: 'tidb_cdc', fromBeginning: true });
    console.log('Subscribed to topic: tidb_cdc');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value.toString();
          let payload;
          
          try {
            payload = JSON.parse(value);
          } catch (e) {
            payload = value;
          }

          logger.info({
            timestamp: new Date().toISOString(),
            action: 'db_change',
            topic: topic,
            payload: payload
          });
        } catch (error) {
          console.error('Error processing message:', error);
        }
      }
    });
  } catch (error) {
    console.error('Consumer error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await consumer.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await consumer.disconnect();
  process.exit(0);
});

run();

