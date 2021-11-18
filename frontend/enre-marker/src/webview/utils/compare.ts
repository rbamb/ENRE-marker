// eslint-disable-next-line max-len
export const isLocEqual = (l1: remote.location, l2: remote.location) => (l1.start.line === l2.start.line) && (l1.start.column === l2.start.column) && (l1.end.line === l2.end.line) && (l1.end.column === l2.end.column);
