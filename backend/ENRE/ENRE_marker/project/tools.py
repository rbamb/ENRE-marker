import json
from collections import defaultdict
from .models import Project, File, Entity, Relation


def json_to_python(filepath):
    f = open(filepath, 'r', encoding='utf-8')
    s = f.read()
    data = json.loads(s)
    return data


def unify_path(path, project_name):
    if '\\' in path:
        components = path.split('\\')
        return '/'.join(components).split(project_name + '/')[1]
    return path


def convert_entity_type(kind):
    entity_type = 0
    if ("Variable" in kind) or ("EnumConstant" in kind):
        entity_type = 1
    elif ("Method" in kind) or ("Constructor" in kind):
        entity_type = 2
    elif "Interface" in kind:
        entity_type = 3
    elif "Annotation" in kind:
        entity_type = 4
    elif "Enum Type" in kind:
        entity_type = 5
    elif "Class" in kind:
        entity_type = 6
    elif "File" in kind:
        entity_type = 7
    elif "Package" in kind:
        entity_type = 8
    return entity_type


def convert_relation_type(kind):
    relation_type = 0
    if 'Import' in kind:
        relation_type = 1
    elif 'Extend' in kind:
        relation_type = 2
    elif 'Implement' in kind:
        relation_type = 3
    elif 'Call' in kind:
        relation_type = 4
    elif 'Set' in kind:
        relation_type = 5
    elif 'Use' in kind:
        relation_type = 6
    elif 'Modify' in kind:
        relation_type = 7
    elif 'Cast' in kind:
        relation_type = 8
    elif 'Create' in kind:
        relation_type = 9
    elif 'Typed' in kind:
        relation_type = 10
    return relation_type


def create_project(github_url, p_name, lang):
    p = Project()
    if Project.objects.filter(p_name=p_name, github_url=github_url, lang=lang).exists():
        p = Project.objects.get(p_name=p_name, github_url=github_url, lang=lang)
    else:
        p.p_name = p_name
        p.github_url = github_url
        p.lang = lang
        p.save()
    return p


def create_file(p, file_path, project_name):
    f = File()
    if File.objects.filter(pid=p, file_path=unify_path(file_path, project_name)).exists():
        f = File.objects.get(pid=p, file_path=unify_path(file_path, project_name))
    else:
        f.pid = p
        f.file_path = unify_path(file_path, project_name)
        # f.save()
    return f


def find_file(p, file_path, project_name):
    if File.objects.filter(pid=p, file_path=unify_path(file_path, project_name)).exists():
        return File.objects.get(pid=p, file_path=unify_path(file_path, project_name))


def extract_file_data(p, data):
    variables = data['variables']
    f_list = []
    for variable in variables:
        f_list.append(create_file(p, variable, p.p_name))
    File.objects.bulk_create(f_list)


def create_entity(f, kind, name, s_line, s_column, e_line, e_column):
    e = Entity()
    if Entity.objects.filter(fid=f, code_name=name, entity_type=kind).exists():
        e = Entity.objects.get(fid=f, code_name=name, entity_type=kind)
    else:
        e.fid = f
        e.code_name = name
        e.entity_type = kind
        e.loc_start_line = s_line
        e.loc_start_column = s_column
        e.loc_end_line = e_line
        e.loc_end_column = e_column
        e.save()
    return e


def process_und(relation_data, entity_data, p, project_name):
    entities = entity_data['entity']
    e_list = []
    e_name_list = []
    for entity in entities:
        e_file = find_file(p, entity.get('entityFile'), project_name)
        e_type = convert_entity_type(entity.get('entityType'))
        e_name = unify_path(entity.get('entityName'), project_name)
        if e_name in e_name_list:
            continue
        else:
            e_name_list.append(e_name)
            e_list.append(Entity(fid=e_file, code_name=e_name, entity_type=e_type,
                                 loc_start_line=entity.get('start_line'), loc_start_column=entity.get('start_column'),
                                 loc_end_line=entity.get('end_line'), loc_end_column=entity.get('end_column')))
    Entity.objects.bulk_create(e_list)

    Entity.objects.order_by('fid').distinct('fid', )
    cells = relation_data['cells']
    r_list = []
    r_dict = defaultdict(list)
    for cell in cells:
        for detail in cell['details']:
            relation_type = convert_relation_type(detail.get('type'))
            src_file = find_file(p, detail.get('src').get('file'), project_name)
            src_entity_type = convert_entity_type(detail.get('src').get('kind'))
            src_entity = Entity.objects.filter(fid=src_file, entity_type=src_entity_type,
                                               code_name=unify_path(detail.get('src').get('object'), project_name))
            if src_entity.exists():
                src_entity = Entity.objects.get(fid=src_file, entity_type=src_entity_type,
                                                code_name=unify_path(detail.get('src').get('object'), project_name))
            else:
                src_entity = create_entity(src_file, src_entity_type,
                                           unify_path(detail.get('src').get('object'), project_name), -1, -1, -1, -1)

            dest_file = find_file(p, detail.get('dest').get('file'), project_name)
            dest_entity_type = convert_entity_type(detail.get('dest').get('kind'))
            dest_entity = Entity.objects.filter(fid=dest_file, entity_type=dest_entity_type,
                                                code_name=unify_path(detail.get('dest').get('object'), project_name))
            if dest_entity.exists():
                dest_entity = Entity.objects.get(fid=dest_file, entity_type=dest_entity_type,
                                                 code_name=unify_path(detail.get('dest').get('object'), project_name))
            else:
                dest_entity = create_entity(dest_file, dest_entity_type,
                                            unify_path(detail.get('dest').get('object'), project_name), -1, -1, -1, -1)
            if src_entity.code_name in r_dict.keys():
                if (dest_entity.code_name, relation_type) in r_dict[src_entity.code_name]:
                    continue
            else:
                r_dict[src_entity.code_name].append((dest_entity.code_name, relation_type))
                r = Relation()
                r.relation_type = relation_type
                r.from_entity = src_entity
                r.to_entity = dest_entity.eid
                r_list.append(r)
    Relation.objects.bulk_create(r_list)
