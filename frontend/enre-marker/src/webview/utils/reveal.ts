export const revealEntity = (e: remote.entity) => {
  if (!e.status.hasBeenReviewed || e.status.operation !== 2) {
    return e;
  }
  return e;
};
