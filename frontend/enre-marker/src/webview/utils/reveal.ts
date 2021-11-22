export const revealEntity = (e: remote.entity) => {
  if (e.status.hasBeenReviewed && e.status.operation === 2) {
    const newly = e.status.newEntity as remote.manuallyEntity;
    const dup = { ...e };
    dup.name = newly.name;
    dup.eType = newly.eType;
    dup.loc = newly.loc;
    return dup;
  }
  return e;
};
