import amqplib from "amqplib";
import { ServiceBusClient } from "@azure/service-bus";
import { config } from "./config.js"; // Import configuration settings

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds delay between retries

// Initialize RabbitMQ if enabled
let rabbitConnection;
let rabbitChannel;

if (config.rabbitmqEnabled) {
  (async () => {
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
  })();
}

// Initialize Azure Service Bus if enabled
let serviceBusClient;
let serviceBusSender;

if (config.azureServiceBusEnabled) {
  try {
    console.log("Initializing Azure Service Bus...");
    serviceBusClient = ServiceBusClient.createFromConnectionString(
      config.serviceBusConnectionString
    );
    serviceBusSender = serviceBusClient.createSender(config.queueName);
    console.log("Azure Service Bus initialized and sender created.");
  } catch (error) {
    console.error("Error initializing Azure Service Bus:", error);
  }
}

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

  if (config.azureServiceBusEnabled && serviceBusSender) {
    try {
      console.log("Sending messages to Azure Service Bus...");
      for (const chunk of chunks) {
        console.log("Sending chunk to Azure Service Bus:", chunk);
        await sendToAzureServiceBusWithRetry(chunk);
      }
    } catch (error) {
      console.error("Error sending messages to Azure Service Bus:", error);
    }
  } else {
    console.warn(
      "Azure Service Bus is not enabled or sender is not initialized."
    );
  }
}

async function sendToRabbitQueueWithRetry(message, attempt = 1) {
  try {
    if (!rabbitChannel) {
      throw new Error("RabbitMQ channel is not initialized.");
    }
    console.log(
      `Sending message to RabbitMQ queue ${config.rabbitQueueName}:`,
      message
    );
    await rabbitChannel.sendToQueue(
      config.rabbitQueueName,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log("Message successfully sent to RabbitMQ queue.");
  } catch (error) {
    console.error(
      `Error sending message to RabbitMQ. Attempt ${attempt}:`,
      error
    );
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      await sendToRabbitQueueWithRetry(message, attempt + 1);
    } else {
      console.error(
        "Max retry attempts reached for RabbitMQ. Message not sent:",
        error
      );
      // Optionally, move the message to a dead-letter queue or log it for manual review
    }
  }
}

async function sendToAzureServiceBusWithRetry(message, attempt = 1) {
  try {
    if (!serviceBusSender) {
      throw new Error("Azure Service Bus sender is not initialized.");
    }
    console.log(
      `Sending message to Azure Service Bus queue ${config.queueName}:`,
      message
    );
    await serviceBusSender.sendMessages({ body: JSON.stringify(message) });
    console.log("Message successfully sent to Azure Service Bus queue.");
  } catch (error) {
    console.error(
      `Error sending message to Azure Service Bus. Attempt ${attempt}:`,
      error
    );
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      await sendToAzureServiceBusWithRetry(message, attempt + 1);
    } else {
      console.error(
        "Max retry attempts reached for Azure Service Bus. Message not sent:",
        error
      );
      // Optionally, move the message to a dead-letter queue or log it for manual review
    }
  }
}

export { sendChunks };
