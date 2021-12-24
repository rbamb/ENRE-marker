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


def contain(keyword, raw):
    return bool(re.search(r'(^| )%s' % keyword, raw))


if __name__ == '__main__':
    print('Openning udb file...')
    db = understand.open(args.db)

    rel_list = []

    print('Exporting relations...')
    rel_count = 0
    for ent in db.ents():
        if ent.language() == 'Java':
            for ref in ent.refs('~End', '~Unknown ~Unresolved ~Implicit'):
                if ref.isforward():
                    rel_list.append({
                        'from': ref.scope().id(),
                        'to': ref.ent().id(),
                        'type': ref.kindname(),
                        'line': ref.line(),
                        'column': ref.column()
                    })
                    rel_count += 1

    all_rel_kinds = set()
    for rel in rel_list:
        all_rel_kinds.add(rel['type'])

    print('Mapping string-ed types to numbers...')
    for rel in rel_list:
        if contain('Import', rel['type']):
            rel['type'] = 1
        elif contain('Inherit', rel['type']) \
                or contain('Extend', rel['type']):
            rel['type'] = 2
        elif contain('Implement', rel['type']):
            rel['type'] = 3
        elif contain('Call', rel['type']):
            rel['type'] = 4
        elif contain('Set', rel['type']):
            rel['type'] = 5
        elif contain('Use', rel['type']):
            rel['type'] = 6
        elif contain('Modify', rel['type']):
            rel['type'] = 7
        elif contain('Cast', rel['type']):
            rel['type'] = 8
        elif contain('Create', rel['type']):
            rel['type'] = 9
        elif contain('Typed', rel['type']):
            rel['type'] = 10
        elif contain('Throw', rel['type']):
            rel['type'] = 11
        elif contain('Couple', rel['type']):
            rel['type'] = 12
        elif contain('Contain', rel['type']) \
                or contain('Define', rel['type']) \
                or contain('Declare', rel['type']):
            rel['type'] = 13
        elif contain('DotRef', rel['type']):
            rel['type'] = 14
        elif contain('Override', rel['type']):
            rel['type'] = 15
        else:
            print(f'Meets unhandled relation type {rel["type"]}')
            sys.exit(-1)

    print('Saving results to the file...')
    with open(args.out, 'w') as out:
        json.dump(rel_list, out, indent=4)
    print(f'Total {rel_count} relations are successfully exported')
    print('All possible relation types are', sorted(all_rel_kinds))
