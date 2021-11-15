interface langTableElement {
  text: string,
  color: string,
}

export type langTableIndex = 'js' | 'java' | 'cpp' | 'go' | 'python';

export const langTable: Record<langTableIndex, langTableElement> = {
  js: {
    text: 'JavaScript',
    color: 'gold',
  },
  java: {
    text: 'Java',
    color: 'volcano',
  },
  cpp: {
    text: 'C/C++',
    color: 'green',
  },
  go: {
    text: 'Golang',
    color: 'cyan',
  },
  python: {
    text: 'Python',
    color: 'purple',
  }
}

interface typeTableElement {
  entity: Array<string>,
  relation: Array<string>,
}

export const typeTable: Record<langTableIndex, typeTableElement> = {
  js: {
    entity: [],
    relation: [],
  },
  java: {
    entity: [],
    relation: [],
  },
  cpp: {
    entity: ['Variable', 'Function'],
    relation: ['Call', 'Use'],
  },
  go: {
    entity: [],
    relation: [],
  },
  python: {
    entity: [],
    relation: [],
  }
}
