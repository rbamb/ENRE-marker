import { langTableIndex } from '../.static/config';

const canBeModifiedForJava = (eType: number) => eType !== 7;

const displayCodeNameForJava = (record: remote.entity) => {
  const split = record.name.split('.');
  if (record.eType === 7) { // File
    return `${split[split.length - 2]}.java`;
  }
  return split[split.length - 1];
};

const updateCodeNameForJava = (newly: string, origin?: string) => {
  if (origin !== undefined) {
    const split = origin.split('.');
    split[split.length - 1] = newly;
    return split.join('.');
  }
  return newly;
};

interface langRelativeUtils {
  canBeModified: (eType: number) => boolean,
  displayCodeName: (record: remote.entity) => string,
  updateCodeName: (newly: string, origin?: string) => string,
}

const obj: Record<langTableIndex, langRelativeUtils> = {
  js: {
    canBeModified: (eType) => true,
    displayCodeName: (record) => record.name,
    updateCodeName: (newly) => newly,
  },
  java: {
    canBeModified: canBeModifiedForJava,
    displayCodeName: displayCodeNameForJava,
    updateCodeName: updateCodeNameForJava,
  },
  cpp: {
    canBeModified: (eType) => true,
    displayCodeName: (record) => record.name,
    updateCodeName: (newly) => newly,
  },
  go: {
    canBeModified: (eType) => true,
    displayCodeName: (record) => record.name,
    updateCodeName: (newly) => newly,
  },
  python: {
    canBeModified: (eType) => true,
    displayCodeName: (record) => record.name,
    updateCodeName: (newly) => newly,
  },
};

export default obj;
