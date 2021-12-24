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
    entity: ['Unknown', 'Variable', 'Method', 'Interface', 'Annotation', 'Enum', 'Class', 'File', 'Package', 'Module', 'TypeVariable'],
    relation: ['Unknown', 'Import', 'Inherit', 'Implement', 'Call', 'Set', 'Use', 'Modify', 'Cast', 'Create', 'Typed', 'Throw', 'Couple', 'Contain', 'DotRef', 'Override'],
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
    entity: ['Unknown Class', 'Variable', 'Unresolved Attribute', 'Unknown Variable', 'Parameter', 'File', 'Attribute', 'Property', 'Ambiguous Attribute', 'Abstract Class', 'Function', 'Unknown Module', 'Module File', 'LambdaParameter', 'Unknown Package', 'Class', 'Package'],
    relation: ['Couple', 'Declare', 'Declare Implicit', 'Raise', 'Define', 'Getter', 'Call', 'Import From', 'Import', 'Import Implicit', 'Set', 'Hasambiguous', 'Use', 'Contain', 'Inherit', 'Modify', 'Alias', 'Setter'],
  }
}
