interface langTableElement {
  text: string,
  color: string,
}

export type langTableIndex = 'js' | 'java' | 'cpp' | 'go' | 'python';

type langTableType = Record<langTableIndex, langTableElement>

export const langTable: langTableType = {
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

export enum jsEntity {

}

export enum jsRelation {

}

export enum javaEntity {

}

export enum javaRelation {

}

export enum cppEntity {

}

export enum cppRelation {

}

export enum golangEntity {

}

export enum golangRelation {

}

export enum pythonEntity {

}

export enum pythonRelation {

}
