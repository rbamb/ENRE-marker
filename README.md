# ENRE-marker Spec

ENRE-marker is a tool for manually label truth entities and relations analysed by well-known tools, and by making a set of ground-truth dataset, to help build better code analysis tools.

ENRE-marker is a VSCode extension where holds UI and main functionalities and a backend server where data stores at.

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
  pswd: 256-chars
}
```

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success',
  token: 256-chars,
  name: string
}
```

`token` is an user-specific string to record login status, and `expire time` should also be set, if it passes the expire time, a re-login is needed.

Once the `token` has been sent to client, any further requests will contain this `token` in the http `header` block for user identify, so that server should always check `token` in the header block for security issues.

###### if failed

| case | code | message | other |
| --- | --- | --- | --- |
| any login issues | 401 | unauthorized |

> Code `401` should always be returned if `token` is wrong or expired **in APIs below**, which is omitted in latter error code table.


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
  progress: number(0...100),
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

* `progress` is the label progress where `100` means that all entities and relations are labeled;

* `claimed` indicates that whether the current user has claimed this project;

* `state` is a number indicating the state of this project,
where `0` means active (user can claim this project and do mark things); `1` means locked (user can no longer do any modification toward this project but only viewing)

> A project may also be `deleted` or at other states, but those are not cared by the frontend, so the server should keep frontend transparent about that (not returning these kind of projects).

###### if failed

| case | code | message | other |
| --- | --- | --- | --- |
| any | 500 | error |

#### `POST /project/<pid: number>/claim`

Claim a project to label. A user can only claim one project in a single time, and a project can be claimed by multiple users. If this API is called when the user already claimed a project before, then just override with the newest one.

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'succeeded',
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

#### `GET /project/<pid: number>`

View infos of the specificed project.

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'succeeded',
  file: Array<file>,
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

#### `GET /project/<pid: number>/file/<fid: number>/entity`

Get all entities in a specified file from a specified project.

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success',
  entity: Array<entity>
}

declare type entity {
  eid: number,
  name: string,
  loc: location,
  type: number,
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
  type: number
}
```

* **`line` and `column` in `location` are started from 0.**

> Server should always return the **original** entity in `Array<entity>`, any modification should be held in `manuallyEntity`

###### if failed

| case | code | message | other |
| --- | --- | --- | --- |
| any | 500 | error |
| pid does not exist | 4001 | no such pid |
| fid does not exist | 4002 | no such fid |

#### `GET /project/<pid: number>/file/<fid: number>/relation`

Get all relations **started from** the specified file.

##### Should return

###### if succeeded

```ts
{
  code: 200,
  message: 'success',
  reltion: Array<relation>
}

declare type relation {
  rid: number,
  from: entity,
  to: entity,
  toFid: number,
  type: number,
  status: status
}

declare type status {
  hasBeenReviewed: boolean,
  // Below properties only appear if hasBeenReviewed is true
  operation: operation,
  // Below properties only appear if operation is 2
  newRelation: manuallyRelation
}

declare type manuallyRelation {
  from: entity,
  to: entity,
  type: number
}
```

* `toFid` indicates the file which the `to` entity in this relation belongs to.

> Since this API is called based on the `fid` of the `from` entity, so `fromFid` like thing can be omit, and be infered during runtime.

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
  new: manuallyEntity
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
  relation: manuallyRelation
}

declare type relationFixPatch {
  shouldBe: fixOption,
  // Below properties only appear if shouldBe is 2 (modified)
  new: onlyEid
}

declare type onlyEid {
  from: number,
  to: number,
  type: number
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
  pswd char(256) not null,
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
  token char(256) not null,
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
