from django.core.management.base import BaseCommand, CommandError
from project.models import Project, File, Entity, Relation
from user.models import Log
import json


def load_json(filepath):
    f = open(filepath, 'r', encoding='utf-8')
    s = f.read()
    # TODO: Reformat with stream
    data = json.loads(s)
    return data


def entity_type_str2int_java(string):
    array = ['Unknown', 'Variable', 'Method', 'Interface', 'Annotation', 'Enum', 'Class', 'File', 'Package', 'Module', 'TypeVariable']
    try:
        return array.index(string)
    except ValueError:
        return -1


def relation_type_str2int_java(string):
    array = ['Unknown', 'Import', 'Inherit', 'Implement', 'Call', 'Set', 'Use', 'Modify', 'Cast', 'Create', 'Typed', 'Throw', 'Couple', 'Contain', 'DotRef', 'Override', 'Export']
    try:
        return array.index(string)
    except ValueError:
        return -1


def perform_java(project, raw):
    print('''Java pre-mark perform limited functionalities due to ENRE-java's export format:
    * Only check location's start line if multiple entities with same name are found\n''')

    # Pre-fetch e/r related to this project
    db_file = File.objects.filter(pid=project)
    db_entity = Entity.objects.filter(fid__in=db_file)
    db_relation = Relation.objects.filter(from_entity__in=db_entity)

    raw_entity = raw.get('variables')
    raw_relation = raw.get('cells')

    ent_match_dict = {}

    print('Perform entity matching...')
    for ent in raw_entity:
        try:
            ent_name = ent.get('qualifiedName')
            ents_in_db = db_entity.filter(code_name=ent_name, shallow=False)
            ents_in_db_count = ents_in_db.count()
            for ent_in_db in ents_in_db:
                if ent_in_db.entity_type == entity_type_str2int_java(ent.get('category'))\
                        and (ent_in_db.loc_start_line == ent.get('startLine') if ents_in_db_count > 1 else True):
                    if ent_in_db.reviewed != Entity.ReviewedOption.notYet:
                        if ent_in_db.reviewed == Entity.ReviewedOption.reviewPassed:
                            # Still record map dict for relation pre-mark to use
                            ent_match_dict[ent.get('id')] = {
                                'eid_in_db': ent_in_db.eid,
                                'name': ent_in_db.code_name,
                            }
                            try:
                                Log.objects.get(
                                    uid=1,
                                    op_to=Log.OpTo.ENTITY,
                                    operation=Log.Operation.REVIEWPASSED,
                                    element_id=ent_in_db.eid,
                                )
                                continue
                            except:
                                pass
                            print(f'Overriding existed PASSED entity with name {ent_name} to author as ENRE')
                        else:
                            print(
                                f'Conflict encountered with entity with name {ent_name} and db_state {ent_in_db.reviewed}')
                            continue

                    ent_in_db.reviewed = Entity.ReviewedOption.reviewPassed
                    ent_in_db.save()
                    Log.objects.create(
                        uid_id=1,
                        op_to=Log.OpTo.ENTITY,
                        operation=Log.Operation.REVIEWPASSED,
                        element_id=ent_in_db.eid,
                    )
                    ent_match_dict[ent.get('id')] = {
                        'eid_in_db': ent_in_db.eid,
                        'name': ent_in_db.code_name,
                    }
        except Entity.DoesNotExist:
            print(f'Encounter DoesNotExist with entity name {ent.get("qualifiedName")}')
        except Entity.MultipleObjectsReturned:
            print(f'Encounter MultipleObjectsReturned with entity name {ent.get("qualifiedName")}')

    print('Perform relation match...')
    count_matched_relation = 0
    for rel in raw_relation:
        src = ent_match_dict.get(rel.get('src'))
        dest = ent_match_dict.get(rel.get('dest'))

        rel_type = list(rel.get('values').keys())[0]

        if src is None or dest is None:
            continue

        try:
            rel_in_db = db_relation.get(
                from_entity__eid=src.get('eid_in_db'),
                to_entity__eid=dest.get('eid_in_db'),
                shallow=False,
            )

            if rel_in_db.relation_type == relation_type_str2int_java(rel_type):
                if rel_in_db.reviewed != Relation.ReviewedOption.notYet:
                    if rel_in_db.reviewed == Relation.ReviewedOption.reviewPassed:
                        print(f'Overriding existed PASSED relation to author as ENRE.')
                    else:
                        print(
                            f'Conflict encountered with relation with name {rel.get("src")} -{rel_type}-> {rel.get("dest")}')
                        continue

                rel_in_db.reviewed = Relation.ReviewedOption.reviewPassed
                rel_in_db.save()
                Log.objects.create(
                    uid_id=1,
                    op_to=Log.OpTo.RELATION,
                    operation=Log.Operation.REVIEWPASSED,
                    element_id=rel_in_db.rid,
                )
                count_matched_relation += 1
        except Relation.DoesNotExist:
            pass
        except Relation.MultipleObjectsReturned:
            print(f'Encounter MultipleObjectsReturned with relation {rel.get("src")} -{rel_type}-> {rel.get("dest")}')

    print(f'Successfully pre-mark {len(ent_match_dict.keys())} entities and {count_matched_relation} relations')


class Command(BaseCommand):
    help = 'Pre mark a project\'s data using ENRE\' output'

    def add_arguments(self, parser):
        parser.add_argument('pid', type=int)
        parser.add_argument('ENRE_output_json', type=str)

    def handle(self, *args, **options):
        pid = options['pid']

        try:
            project = Project.objects.get(pid=pid)
        except Project.DoesNotExist:
            raise CommandError(f'Project with pid {pid} does not exist')

        if project.lang == 'java':
            perform_java(project, load_json(options['ENRE_output_json']))
        else:
            raise CommandError(f'Unsupported language {project.lang}')
