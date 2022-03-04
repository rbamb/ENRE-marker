# ENRE-marker Spec

## Import File Format

To import data to database, ENRE-marker expects 2 files:

* `ProjectName_entities.json`

* `ProjectName_refs.json`

<del>Files basically share the format which perl scripts output</del> (See scripts in `/input` to inspect the format), only with some pre-processes that should be handled BEFORE import:

* All `FilePath` or relative file path filed should be relative path from project's root, **not** an absolute path in your computer;

* Make sure code locations are correct, especially the column number;

* Type relative field like `entityType` and `relationType` should be a number which meaning is defined in ENRE-marker's issue page.

## InterOP API definitions

Backend server should implement and expose web http RESTful interfaces listed below.

### Prefix

All http RESTful interfaces should add the prefix ```/api/v1``` , which is omitted below.

### User System

#### `POST /user/login`

To login a user.

##### Payload body

```ts
{
  uid: 6-digits-number,
  pswd: 64-chars
}
```

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success',
  token: 64-chars,
  name: string
}
```

`token` is an user-specific string to record login status, and `expire time` should also be set, if it passes the expire time, a re-login is needed.

Once the `token` has been sent to client, any further requests will contain this `token` in the http `header` block for user identify, so that server should always check `token` in the header block for security issues.

###### if failed

| case | code | message | other |
| --- | --- | --- | --- |
| any login issues | 401 | unauthorized |
| wrong uid or pswd | 4000 | not match |

> Code `401` should always be returned if `token` is wrong or expired **in APIs below**, which is omitted in latter error code table.

#### `POST /user/password`

Change a user's password.

##### Payload body
```ts
{
  old: 64-chars,
  new: 64-chars
}
```

##### Should return

###### If succeeded

```ts
{
  code: 200,
  message: 'success'
}
```

###### If failed

| case | code | message | other |
| --- | --- | --- | --- |
| any login issues | 401 | unauthorized |
| wrong pswd | 4000 | wrong old password |

### Project System

#### `GET /project`

Get project lists.

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success',
  project: Array<project>
}

declare type project {
  pid: number,
  name: string,
  githubUrl: string
  version: 7-chars-git-commit-code,
  lang: language-code,
  progress: number(0...),
  claimed: bool,
  state: projectState
}

declare type language-code = 'js' | 'java' | 'cpp' | 'go' | 'python'

declare enum projectState {
  active = 0,
  locked = 1
}
```
* `githubUrl` should be in this pattern `user/repository`, which means the prefix `https://github.com/` is not needed;

* `lang` is strictly limited to 5 option lowercase strings listed above, which means only accept `js` rather than `JS`/`javascript`/`JavaScript`;

* `progress` is the label progress where `100` means that all entities and relations are labeled, it can exceed `100` which means not only all are labeled, but also discovered some new e/rs (the extra part will only be counted after all existing are labedled);

* `claimed` indicates that whether the current user has claimed this project;

* `state` is a number indicating the state of this project,
where `0` means active (user can claim this project and do mark things); `1` means locked (user can no longer do any modification toward this project but only viewing)

> A project may also be `deleted` or at other states, but those are not cared by the frontend, so the server should keep frontend transparent about that (not returning these kind of projects).

###### if failed

| case | code | message | other |
| --- | --- | --- | --- |
| any | 500 | error |

#### `GET /project/<pid: number>/stats`

Get a project's statistic data.

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success',
  data: {
    entities: {
      countByCategory: {
        premarked: number,
        passed: number,
        removed: number,
        modified: number,
        unreviewed: number,
        inserted: number,
      }
    },
    relations: {
      countByCategory: (...),
    },
    contributions: {
      total: [
        {
          uid: number,
          name: string,
          operations: {
            passed: number,
            removed: number,
            modified: number,
            inserted: number,
          }
        }
      ]
      thisWeek: (...)
    }
  },
}
```

#### `POST /project/<pid: number>/claim`

Claim a project to label. A user can only claim one project in a single time, and a project can be claimed by multiple users. If this API is called when the user already claimed a project before, then just override with the newest one.

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success',
  collaborator: Array<user>
}

declare type user {
  uid: number,
  name: string
}
```

###### is failed

| case | code | message | other |
| --- | --- | --- | --- |
| any | 500 | error |
| pid does not exist | 4001 | no such pid |

#### `GET /project/<pid: number>?page=<page: number>&size=<size: number>`

View infos of the specificed project.

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success',
  file: Array<file>,
  total: number
}

declare type file {
  fid: number,
  path: relative-path-string,
  entity: {
    count: number,
    progress: number(0...100)
  },
  relation: {
    count: number,
    progress: number(0...100)
  }
}
```

* `dir` is the src path from the `.git` top-level dir-path;

* `file`'s `path` is a relative path from project's root;

#### `GET /project/<pid: number>/file/<fid: number>/entity?page=<page: number>&size=<size: number>`

Get all entities in a specified file from a specified project.

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success',
  entity: Array<entity>,
  total: number
}

declare type entity {
  eid: number,
  name: string,
  loc: location,
  eType: number,
  status: status
}

declare type location {
  start: {
    line: number,
    column: number
  },
  end: {
    line: number,
    column: number
  }
}

declare type status {
  hasBeenReviewed: boolean,
  // Below properties only appear if hasBeenReviewed is true
  operation: operation,
  // Below properties only appear if operation is 2
  newEntity: manuallyEntity
}

declare enum operation {
  reviewPassed = 0,
  remove = 1,
  modify = 2,
  insert = 3
}

declare type manuallyEntity {
  name: string,
  loc: location,
  eType: number
}
```

* **`line` and `column` in `location` are started from 1.**

> Server should always return the **original** entity in `Array<entity>`, any modification should be held in `manuallyEntity`

###### if failed

| case | code | message | other |
| --- | --- | --- | --- |
| any | 500 | error |
| pid does not exist | 4001 | no such pid |
| fid does not exist | 4002 | no such fid |

#### `GET /project/<pid: number>/file/<fid: number>/relation?page=<page: number>&size=<size: number>`

Get all relations **started from** the specified file.

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success',
  relation: Array<relation>,
  total: number
}

declare type relation {
  rid: number,
  eFrom: entity,
  eTo: entity,
  toFid: number,
  rLoc: {
    line: number,
    column: number,
  },
  rType: number,
  status: status
}

declare type status {
  hasBeenReviewed: boolean,
  // Below properties only appear if hasBeenReviewed is true
  operation: operation,
  // Below properties only appear if operation is 2
  newRelation: Pick<manuallyRelation, 'eTo', 'rLoc', 'rType'>
}

declare type manuallyRelation {
  eFrom?: number,
  eTo?: number,
  rLoc?: {
    line: number,
    column: number,
  },
  rType: number,
}
```

* `toFid` indicates the file which the `to` entity in this relation belongs to.

> Since this API is called based on the `fid` of the `from` entity, so `fromFid` like thing can be omit, and be infered during runtime.

* `rLoc` contains `line` and `column` where the `eFrom` is actually been used in `eTo`.

###### is failed

| case | code | message | other |
| --- | --- | --- | --- |
| any | 500 | error |
| pid does not exist | 4001 | no such pid |
| rid does not exist | 4002 | no such rid |

#### `POST /project/<pid: number>/file/<fid: number>/entity`

Post user label result(s) of entity to the server.

##### Payload body

```ts
{
  data: Array<entityUserResult>
}

declare type entityUserResult {
  isManually: boolean,
  // Below properties only appear if isManually is false
  eid: number,
  isCorrect: boolean,
    // Below property only appears if isCorrect is false
  fix: entityFixPatch,
  // Below properties only appear if isManually is true
  entity: manuallyEntity
}

declare type entityFixPatch {
  shouldBe: fixOption,
  // Below properties only appear if shouldBe is 2 (modified)
  newly: manuallyEntity
}

declare enum fixOption {
  removed = 1,
  modified = 2
}
```

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success'
}
```

###### if failed

| case | code | message | other |
| --- | --- | --- | --- |
| any | 500 | error |
| contribute to a non claimed project | 403 | not your business |
| pid does not exist | 4001 | no such pid |
| fid does not exist | 4002 | no such fid |
| manually added entity has already exist | 4003 | already exist | ```index: Array<number>``` |

> Error code `4003` indicates that the manually added entity has already discovered by **comparison tools**, NOT by **other users**. This allows multiple users submit the same manually discovered entity.

> If errors occurred, server should return the index of those error-causing `entityUserResult` (starts from 0) in extra.

#### `GET /project/<pid: number>/entity/<eid: number>/cascade`

Before `remove` an entity, fetch this API to gain the info 
about how many related relation will be also removed cascadingly.

##### Should return

###### If succeeded

```ts
{
  code: 200,
  message: 'success',
  count: number
}
```

#### `POST /project/<pid: number>/file/<fid: number>/relation`

Post user label result(s) of relation to the server.

##### Payload body

```ts
{
  data: Array<relationUserResult>
}

declare type relationUserResult {
  isManually: boolean,
  // Below properties only appear if isManually is false
  rid: number,
  isCorrect: boolean,
    // Below property only appears if isCorrect is false
  fix: relationFixPatch,
  // Below properties only appear if isManually is true
  relation: Required<manuallyRelation>
}

declare type relationFixPatch {
  shouldBe: fixOption,
  // Below properties only appear if shouldBe is 2 (modified)
  newly: Pick<manuallyRelation, 'eTo', 'rLoc', 'rType'>
}
```

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success'
}
```

###### if failed

| case | code | message | other |
| --- | --- | --- | --- |
| any | 500 | error |
| contribute to a non claimed project | 403 | not your business |
| pid does not exist | 4001 | no such pid |
| fid does not exist | 4002 | no such fid |
| manually added relation has already exist | 4003 | already exist | ```index: Array<number>``` |

> If errors occurred, server should return the index of those error-causing `relationUserResult` (starts from 0) in extra.


## DB Table Definitions

### Table `user`

```sql
create table if not exists `user`
(
  uid integer(6) not null auto_increment = 1000,
  name char(32) not null,
  pswd char(64) not null,
  claim integer(3) not null,

  primary key (uid),
  foreign key (claim) references project(pid)
)
```

### Table `login`

```sql
create table if not exists `login`
(
  uid integer(6) not null,
  token char(64) not null,
  gen_time timestamp not null,

  primary key (uid),
  foreign key (uid) references user(uid)
)
```

* Expire time is calculated in the program by `exp_time = gen_time + DURATION`.

### Table `project`

```sql
create table if not exists `project`
(
  pid integer(3) not null auto_increment = 100,
  p_name varchar(15) not null, 
  github_url varchar(256) not null,
  git_branch varchar(16) not null default 'main',
  git_commit_hash char(7) not null,
  lang varchar(16) not null,

  state tinyint not null default 0,

  primary key (pid)
)
```

### Table `file`

```sql
create table if not exists `file`
(
  fid integer not null auto_increment,
  pid integer(3) not null,
  file_path varchar(256) not null,

  primary key (fid),
  foreign key (pid) references project(pid)
)
```

### Table `entity`

```sql
create table if not exists `entity`
(
  eid integer not null auto_increment,
  fid integer not null,
  code_name varchar(256) not null,
  loc_start_line integer not null,
  loc_start_column integer not null,
  loc_end_line integer not null,
  loc_end_column integer not null,
  entity_type tinyint not null,

  shallow boolean not null default false,
  inserted boolean not null default false,

  reviewed tinyint not null default -1,

  primary key (eid),
  foreign key (fid) reference file(fid)
)
```

Where column `entity_type` contains type index for certain language:

```ts
declare enum entityTypeForXX {
  unknown = 0,
  variable = 1,
  ...
}
```

`shallow` indicates whether this row is **modified** from another row, or in entity's prospective, an entity is modified, and both the original entity and the modified entity are saved.

`inserted` indicates whether this entity is discovered by user ranther than tools.

`reviewed` indicates thether this entity has been reviewed, possible options are:

```ts
declare enum reviewed {
  inapplicable = -2,
  notYet = -1,
  reviewPassed = 0,
  remove = 1,
  modify = 2
}
```

> `reviewed` only works on the **original** entities, that is, `shallow` == false && `inserted` == false. In contrasted condition, this field should be set to `-2`.

### Table `relation`

```sql
create table if not exists `relation`
(
  rid integer not null auto_increment,
  from_entity integer not null,
  to_entity integer not null,
  relation_type tinyint not null,
  loc_line integer not null,
  loc_column integer not null,

  shallow boolean not null default false,
  inserted boolean not null default false,

  reviewed tinyint not null default -1,

  primary key (rid),
  foreign key (from_entity) references entity (eid)
)
```

### Table `log`

```sql
create table if not exists `log`
(
  lid integer not null auto_increment,
  uid integer(6) not null,
  time timestamp not null default now, 
  op_to tinyint not null,
  operation tinyint not null,
  element_id int not null,
  to_id int,

  primary key (lid),
  foreign key (uid) references user(uid)
)
```

Where:

```ts
declare enum op_to {
  entity = 0,
  relation = 1
}
```

```ts
declare enum operation {
  reviewPassed = 0,
  remove = 1,
  modify = 2,
  insert = 3
}
```

`element_id` (as well as `to_id`) indicates elements (entity or leration) affected by this operation:

* A `reviewPassed` operation should set `element_id` to id of the element which passed the review;

* A `remove` operation should set `element_id` to id of the element being removed;

* A `modify` operation should set `element_id` to id of the element being modified, and also set `to_id` to id of the element which records this modification;

* A `insert` operation should set `element+id` to id of the element being inserted.
