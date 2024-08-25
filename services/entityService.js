function mergeEntityData(existingEntity, newEntity) {
  const updatedEntity = { ...existingEntity };

  for (const key in newEntity) {
    if (newEntity[key] !== existingEntity[key]) {
      updatedEntity[key] = newEntity[key];
    }
  }

  return updatedEntity;
}

export { mergeEntityData };
