declare namespace remote {
  type statusCode = 200 | 500;
  type statusMessage = { 200: 'success', 500: 'error' };

  interface resCommon {
    code: statusCode,
    message: statusMessage[statusCode],
  }

  interface resLogin extends resCommon {
    token: string,
    name: string,
  }

  interface user {
    uid: number,
    name: string,
  }
  interface resClaim extends resCommon {
    collaborator: Array<user>,
  }

  interface resProjects extends resCommon {
    project: Array<project>,
  }

  enum projectState {
    active = 0,
    locked = 1,
  }

  interface project {
    pid: number,
    githubUrl: string,
    name: string,
    version: string,
    lang: string,
    progress: number,
    claimed: boolean,
    state: projectState,
  }

  interface resFiles extends resCommon {
    file: Array<file>,
    total: number,
  }

  interface file {
    fid: number,
    path: string,
    entity: {
      count: number,
      progress: number,
    },
    relation: {
      count: number,
      progress: number,
    },
  }

  interface location {
    start: {
      line: number,
      column: number,
    },
    end: {
      line: number,
      column: number,
    }
  }

  enum operation {
    reviewPassed = 0,
    remove = 1,
    modify = 2,
    insert = 3,
  }

  interface status {
    hasBeenReviewed: boolean,
    operation?: operation,
    newEntity?: manuallyEntity,
    newRelation?: Pick<manuallyRelation, 'rType'>,
  }

  interface resCascade extends resCommon {
    count: number,
  }

  interface resEntities extends resCommon {
    entity: Array<entity>,
    total: number,
  }

  interface entity {
    eid: number,
    name: string,
    loc: location,
    eType: number,
    status: status,
  }

  interface manuallyEntity {
    name: string,
    loc: location,
    eType: number,
  }

  interface resRelations extends resCommon {
    relation: Array<relation>,
    total: number,
  }

  interface relation {
    rid: number,
    eFrom: entity,
    eTo: entity,
    toFid: number,
    line: number,
    column: number,
    rType: number,
    status: status,
  }

  interface manuallyRelation {
    eFrom?: number,
    eTo?: number,
    rLoc?: {
      line: number,
      column: number,
    }
    rType: number,
  }
}
