declare namespace remote {
  type statusCode = 200 | 500;
  type statusMessage = { 200: 'success', 500: 'error' }

  interface resCommon {
    code: statusCode,
    message: statusMessage[statusCode]
  }

  interface resLogin extends resCommon {
    token: string
  }

  interface resProjects extends resCommon {
    project: Array<project>
  }

  interface project {
    pid: number,
    name: string,
    version: string,
    lang: string,
    progress: number,
    claimed: boolean
  }

  interface resFiles extends resCommon {
    dir: string,
    fileHash: Array<file>,
    hash: string
  }

  interface file {
    fid: number,
    path: string,
    entity: {
      count: number,
      progress: number
    },
    relation: {
      count: number,
      progress: number
    }
    hash: string
  }

  interface location {
    start: {
      line: number,
      column: number
    },
    end: {
      line: number,
      column: number
    }
  }

  enum operation {
    reviewPassed = 0,
    remove = 1,
    modify = 2
  }

  interface status {
    hasBeenReviewed: boolean,
    operation?: operation,
    newEntity?: manuallyEntity,
    newRelation?: manuallyRelation
  }

  interface resEntities extends resCommon {
    entity: Array<entity>
  }

  interface entity {
    eid: number,
    name: string,
    loc: location,
    type: string,
    isManually: boolean,
    status: status
  }

  interface manuallyEntity {
    name: string,
    loc: location,
    type: string
  }

  interface resRelations extends resCommon {
    relation: Array<relation>
  }

  interface relation {
    rid: number,
    from: entity,
    to: entity,
    toFid: number,
    type: number,
    isManually: boolean,
    status: status
  }

  interface manuallyRelation {
    from: entity,
    to: entity,
    type: number
  }
}
