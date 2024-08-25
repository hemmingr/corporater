import amqplib from "amqplib";
import { config } from "../config/config.js";
import { entityConfig } from "../config/entityConfig.js";
import { resolveDependency } from "../services/dependencyService.js";
import {
  fetchEntityFromTarget,
  sendDataToTarget,
} from "../services/targetService.js";
import { mergeEntityData } from "../services/entityService.js";

async function consume() {
  const connection = await amqplib.connect(config.rabbitmqUrl);
  const channel = await connection.createChannel();
  await channel.assertQueue(config.rabbitQueueName, { durable: true });

  channel.consume(config.rabbitQueueName, async (msg) => {
    if (msg !== null) {
      const entity = JSON.parse(msg.content.toString());
      const entityType = entity.type; // Assuming the entity type is included in the message
      const entityConfig = entityConfig[entityType];

      if (!entityConfig) {
        console.error(`Unknown entity type: ${entityType}`);
        channel.ack(msg);
        return;
      }

      console.log(`Processing ${entityType}:`, entity);

      try {
        // Resolve dependencies
        for (const dependencyType of entityConfig.dependencies) {
          await resolveDependency(
            entityType,
            dependencyType,
            entity[dependencyType]
          );
        }

        const existingEntity = await fetchEntityFromTarget(
          entityType,
          entity.id
        );

        if (existingEntity) {
          const updatedEntity = mergeEntityData(existingEntity, entity);
          await sendDataToTarget(entityType, updatedEntity);
        } else {
          await sendDataToTarget(entityType, entity);
        }

        channel.ack(msg);
      } catch (error) {
        console.error("Error processing message:", error);
        // Optionally, you can requeue the message or handle the error as needed
      }
    }
  });
}

consume();
