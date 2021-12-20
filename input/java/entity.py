import understand
import argparse
import json

# Usage
parser = argparse.ArgumentParser()
parser.add_argument('db', help='Specify Understand database')
parser.add_argument('out', help='specify output file\'s name and location')
args = parser.parse_args()


if __name__ == '__main__':
    db = understand.open(args.db)

    ent_list = []
    # Add a default virtual file entity that holds all unresolved entities
    ent_list.append({
        'id': 0,
        'type': 'File',
        'name': '[[Virtual File]]',
    })

    # Extract file entity first
    print('Exporting File entities...')
    for ent in db.ents('File'):
        # Filter only java files
        if ent.language() == 'Java':
            ent_list.append({
                'id': ent.id(),
                'type': 'File',
                'name': ent.relname(),
            })

    print('Exporting entities other that File...')
    regular_count = 0
    # Filter entities other than file
    for ent in db.ents('~File ~Unknown ~Unresolved ~Implicit'):
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
            elif ent.kindname() == 'Package':
                # Package, which is possible to have multipul parent nodes
                decls = ent.refs('Declarein')
                for decl in decls:
                    line = decl.line()
                    start_column = decl.column() + 1
                    end_column = start_column + len(ent.simplename())
                    ent_list.append({
                        'id': ent.id(),
                        'type': ent.kindname(),
                        'name': ent.longname(),
                        'start_line': line,
                        'end_line': line,
                        'start_column': start_column,
                        'end_column': end_column,
                        'belongs_to': decl.file().id(),
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

                break

    print('Saving results to the file...')
    with open(args.out, 'w') as out:
        json.dump(ent_list, out, indent=4)
    print(f'Total {regular_count} entities are successfully exported')

    all_ent_kinds = set()
    for ent in ent_list:
        all_ent_kinds.add(ent['type'])
    print('All possible entity type are', sorted(all_ent_kinds))
