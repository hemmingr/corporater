import amqplib from "amqplib";
import { config } from "../config/config.js";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds delay between retries

let rabbitConnection;
let rabbitChannel;

async function initializeRabbitMQ() {
  if (config.rabbitmqEnabled) {
    try {
      console.log("Initializing RabbitMQ...");
      rabbitConnection = await amqplib.connect(config.rabbitmqUrl);
      rabbitChannel = await rabbitConnection.createChannel();
      await rabbitChannel.assertQueue(config.rabbitQueueName, {
        durable: true,
      });
      console.log("RabbitMQ initialized and queue asserted.");
    } catch (error) {
      console.error("Error initializing RabbitMQ:", error);
    }
  }
}

initializeRabbitMQ();

async function sendChunks(chunks) {
  if (config.rabbitmqEnabled && rabbitChannel) {
    try {
      console.log("Sending messages to RabbitMQ...");
      for (const chunk of chunks) {
        console.log("Sending chunk to RabbitMQ:", chunk);
        await sendToRabbitQueueWithRetry(chunk);
      }
    } catch (error) {
      console.error("Error sending messages to RabbitMQ:", error);
    }
  } else {
    console.warn("RabbitMQ is not enabled or channel is not initialized.");
  }
}

async function sendToRabbitQueueWithRetry(chunk, attempt = 1) {
  try {
    await rabbitChannel.sendToQueue(
      config.rabbitQueueName,
      Buffer.from(JSON.stringify(chunk)),
      {
        persistent: true,
      }
    );
  } catch (error) {
    if (attempt <= MAX_RETRIES) {
      console.warn(
        `Attempt ${attempt} failed. Retrying in ${
          RETRY_DELAY / 1000
        } seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      await sendToRabbitQueueWithRetry(chunk, attempt + 1);
    } else {
      console.error(
        "Max retries reached. Could not send message to RabbitMQ:",
        error
      );
    }
  }
}

export { sendChunks };
