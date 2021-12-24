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
    # Add a default virtual file entity that holds all unresolved entities
    ent_list.append({
        'id': 0,
        'type': 'File',
        'name': '[[Virtual File]]',
    })

    # Extract file entities first
    print('Exporting File entities...')
    file_count = 0
    for ent in db.ents('File'):
        # Filter only java files
        if ent.language() == 'Java':
            ent_list.append({
                'id': ent.id(),
                'type': 'File',
                'name': ent.relname(),
            })
            file_count += 1
    print(f'Total {file_count} files are successfully exported')

    print('Exporting entities other that File...')
    regular_count = 0

    # Package, not belonging to any real files, worth process separately
    for ent in db.ents('Package'):
        if ent.language() == 'Java':
            # Assign Packages to a virtual file to fulfill db schema
            ent_list.append({
                'id': ent.id(),
                'type': ent.kindname(),
                'name': ent.longname(),
                'belongs_to': 0,
            })
            regular_count += 1

    # Filter entities other than file
    for ent in db.ents('~File ~Package ~Unknown ~Unresolved ~Implicit'):
        if ent.language() == 'Java':
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
            # elif ent.kindname() == 'Unresolved Type':
            #     # Unresolved type, however may contains refs
            #     # typeby/useby
            #     # TODO: Figure out the proper way to handle Inplicit
            #     decls = ent.refs('~Inplicit')
            #     for decl in decls:
            #         if decl.kind().longname() == 'Java Extendby Coupleby':
            #             print(
            #                 'Meeting Extendby Coupleby',
            #                 decl.file().relname(),
            #                 decl.line(),
            #                 decl.column()
            #             )
            #             # FIXME: A lambda class
            #             continue
            #         line = decl.line()
            #         start_column = decl.column() + 1
            #         end_column = start_column + len(ent.simplename())
            #         ent_list.append({
            #             'id': ent.id(),
            #             'type': ent.kindname(),
            #             'name': ent.longname(),
            #             'start_line': line,
            #             'end_line': line,
            #             'start_column': start_column,
            #             'end_column': end_column,
            #             'belongs_to': decl.file().id(),
            #         })
            #         regular_count += 1
            # elif ent.kindname() == 'Unknown Method':
            #     pass
            else:
                print(
                    f'After {regular_count} successful append, an unseen situation occured')
                print(
                    ent.id(),
                    ent.kindname(),
                    ent.longname(),
                )
                all_ref_kinds = set()
                for ref in ent.refs():
                    all_ref_kinds.add(ref.kind().longname())
                print('All possible ref kinds are', all_ref_kinds)

                sys.exit(-1)

    all_ent_kinds = set()
    for ent in ent_list:
        all_ent_kinds.add(ent['type'])

    print('Mapping string-ed types to numbers...')
    for ent in ent_list:
        if contain('Variable', ent['type']) \
                or contain('EnumConstant', ent['type']) \
                or contain('Parameter', ent['type']):
            ent['type'] = 1
        elif contain('Method', ent['type']) \
                or contain('Constructor', ent['type']):
            ent['type'] = 2
        elif contain('Interface', ent['type']):
            ent['type'] = 3
        elif contain('Annotation', ent['type']):
            ent['type'] = 4
        elif contain('Enum Type', ent['type']):
            ent['type'] = 5
        elif contain('Class', ent['type']):
            ent['type'] = 6
        elif contain('File', ent['type']):
            ent['type'] = 7
        elif contain('Package', ent['type']):
            ent['type'] = 8
        elif contain('Module', ent['type']):
            ent['type'] = 9
        elif contain('TypeVariable', ent['type']):
            ent['type'] = 10
        else:
            print(f'Meets unhandled entity type {ent["type"]}')
            print(
                ent['id'],
                ent['name'],
            )
            sys.exit(-1)

    print('Saving results to the file...')
    with open(args.out, 'w') as out:
        json.dump(ent_list, out, indent=4)
    print(f'Total {regular_count} entities are successfully exported')
    print('All possible entity types are', sorted(all_ent_kinds))
