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

export const locNotApplicable = (e: remote.entity) => (
  e.loc.start.line === -1 && e.loc.end.line === -1
);

export const revealRelation = (r: remote.relation) => {
  if (r.status.hasBeenReviewed && r.status.operation === 2) {
    const newly = r.status.newRelation as Pick<remote.manuallyRelation, 'rType'>;
    const dup = { ...r };
    dup.rType = newly.rType;
    return dup;
  }
  return r;
};
