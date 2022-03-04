import understand
import argparse
import json
import sys
import re

# Usage
parser = argparse.ArgumentParser()
parser.add_argument('db', help='Specify Understand database')
parser.add_argument('out', help='specify output file\'s name and location')
args = parser.parse_args()


# TODO: Modulize
def contain(keyword, raw):
    return bool(re.search(r'(^| )%s' % keyword, raw))


if __name__ == '__main__':
    print('Openning udb file...')
    db = understand.open(args.db)

    ent_list = []
    # # Add a default virtual file entity that holds all unresolved entities
    # ent_list.append({
    #     'id': 0,
    #     'type': 'File',
    #     'name': '[[Virtual File]]',
    # })

    # Extract file entities first
    print('Exporting File entities...')
    file_count = 0
    for ent in db.ents('File'):
        # Filter only java files
        if ent.language() == 'Python':
            ent_list.append({
                'id': ent.id(),
                'type': 'File',
                # FIXME: using abs path and then minus prefix
                'name': ent.relname(),
            })
            file_count += 1
    print(f'Total {file_count} files are successfully exported')

    print('Exporting entities other that File...')
    regular_count = 0

    # Package, not belonging to any real files, worth process separately
    for ent in db.ents('Package'):
        if ent.language() == 'Python':
            # Assign Packages to a virtual file to fulfill db schema
            ent_list.append({
                'id': ent.id(),
                'type': ent.kindname(),
                'name': ent.longname(),
                'belongs_to': 0,
            })
            regular_count += 1

    # Filter entities other than file
    unseen_entity_type = set()
    for ent in db.ents('~File ~Package ~Unresolved ~Implicit'): #~Unknown
        if ent.language() == 'Python':
            # Although a suffix 's' is added, there should be only
            # one entry that matches the condition
            decls = ent.refs('Definein')
            if decls:
                # Normal entities should have a ref definein contains location
                # about where this entity is defined
                line = decls[0].line()
                start_column = decls[0].column() + 1
                end_column = start_column + len(ent.simplename())
                ent_list.append({
                    'id': ent.id(),
                    'type': ent.kindname(),
                    'name': ent.longname(),
                    'start_line': line,
                    'end_line': line,
                    'start_column': start_column,
                    'end_column': end_column,
                    'belongs_to': decls[0].file().id(),
                })
                regular_count += 1
            else:
                unseen_entity_type.add(ent.kindname())
                ent_list.append({
                    'id': ent.id(),
                    'type': ent.kindname(),
                    'name': ent.longname()
                })
    
    print(unseen_entity_type)
    
    all_ent_kinds = set()
    for ent in ent_list:
        all_ent_kinds.add(ent['type'])

    print('Saving results to the file...')
    with open(args.out, 'w') as out:
        json.dump(ent_list, out, indent=4)
    print(f'Total {regular_count} entities are successfully exported')
    print('All possible entity types are', sorted(all_ent_kinds))