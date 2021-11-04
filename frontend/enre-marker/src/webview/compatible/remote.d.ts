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

  interface resProject extends resCommon {
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
}
