from enum import Enum


# class project_state(Enum):
#     active = 0
#     locked = 1


class Project:
    pid = 0
    name = ""
    githubUrl = ""
    version = ""
    lang = ""
    progress = 0
    claimed = False
    state = 0

    def __init__(self, pid, name, git_url, version, lang, progress, claimed, state):
        self.pid = pid
        self.name = name
        self.githubUrl = git_url
        self.version = version
        self.lang = lang
        self.progress = progress
        self.claimed = claimed
        self.state = state

    def to_dict(self):
        return {"pid": self.pid,
                "name": self.name,
                'githubUrl': self.githubUrl,
                'version': self.version,
                'lang': self.lang,
                'progress': self.progress,
                'claimed': self.claimed,
                'state': self.state}


class User:
    uid = 0
    name = ""

    def __init__(self, uid, name):
        self.name = name
        self.uid = uid

    def to_dict(self):
        return {
            'uid': self.uid,
            'name': self.name
        }


class File:
    fid = 0
    path = ""
    entity = {
        'count': 0,
        'progress': 0
    }
    relation = {
        'count': 0,
        'progress': 0
    }

    def __init__(self, fid, path, e_count, e_progress, r_count, r_progress):
        self.fid = fid
        self.path = path
        self.entity['count'] = e_count
        self.entity['progress'] = e_progress
        self.relation['count'] = r_count
        self.relation['progress'] = r_progress

    def to_dict(self):
        return {
            'fid': self.fid,
            'path': self.path,
            'entity': self.entity,
            'relation': self.relation
        }


class Manually_entity:
    name = ""
    loc = {
        'start': {
            'line': 0,
            'column': 0
        },
        'end': {
            'line': 0,
            'column': 0
        }
    }
    type = 0

    def __init__(self, name, s_l, s_c, e_l, e_c, e_type):
        self.name = name
        self.type = e_type
        self.loc['start']['line'] = s_l
        self.loc['start']['column'] = s_c
        self.loc['end']['line'] = e_l
        self.loc['end']['column'] = e_c

    def to_dict(self):
        return {"name": self.name,
                "loc": self.loc,
                'eType': self.type}


class Entity_status:

    def __init__(self, reviewed, operation, m_entity):
        self.hasBeenReviewed = reviewed
        self.operation = operation
        self.manually_entity = m_entity

    def to_dict(self):
        return {"hasBeenReviewed": self.hasBeenReviewed,
                "operation": self.operation,
                'newEntity': self.manually_entity.to_dict()}


class Entity:
    eid = 0
    name = ""
    loc = {
        'start': {
            'line': 0,
            'column': 0
        },
        'end': {
            'line': 0,
            'column': 0
        }
    }
    type = 0
    status = Entity_status(False, -1, Manually_entity("", 0, 0, 0, 0, 0))

    def __init__(self, eid, name, s_l, s_c, e_l, e_c, e_type, status):
        self.eid = eid
        self.name = name
        self.loc['start']['line'] = s_l
        self.loc['start']['column'] = s_c
        self.loc['end']['line'] = e_l
        self.loc['end']['column'] = e_c
        self.type = e_type
        self.status = status

    def to_dict(self):
        return {"eid": self.eid,
                "name": self.name,
                'loc': self.loc,
                'type': self.type,
                'status': self.status.to_dict()}


class Manually_relation:

    def __init__(self, e_from, e_to, r_type):
        self.e_from = e_from
        self.e_to = e_to
        self.r_type = r_type

    def to_dict(self):
        return {"eFrom": self.e_from,
                "eTo": self.e_to,
                'eType': self.r_type}


class Relation_status:

    def __init__(self, has_been_reviewed, operation, new_relation):
        self.hasBeenReviewed = has_been_reviewed
        self.operation = operation
        self.newRelation = new_relation

    def to_dict(self):
        return {"hasBeenReviewed": self.hasBeenReviewed,
                "operation": self.operation,
                'newRelation': self.newRelation.to_dict()}


class Relation:

    def __init__(self, rid, e_from, e_to, to_fid, r_type, r_status):
        self.rid = rid
        self.e_from = e_from
        self.e_to = e_to
        self.toFid = to_fid
        self.type = r_type
        self.status = r_status

    def to_dict(self):
        return {"rid": self.rid,
                "eFrom": self.e_from,
                'eTo': self.e_to,
                'toFid': self.toFid,
                'rType': self.type,
                'status': self.status.to_dict()}
