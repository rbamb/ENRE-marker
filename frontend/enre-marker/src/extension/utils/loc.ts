export const isValidLoc = (loc: { start: { line: number, column: number }, end: { line: number, column: number } }) => {
  return loc.start.line !== -1 && loc.start.column !== -1 && loc.end.line !== -1 && loc.end.column !== -1;
};
