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
        if ent.language() == 'Python':
            for ref in ent.refs('~Unresolved ~Implicit'):
                if ref.isforward():
                    rel_list.append({
                        'from': ref.scope().id(),
                        'to': ref.ent().id(),
                        # Using kind().longname() rather than kindname() to acquire longname
                        # in case meeting `Pointer` instead of `Use Ptr`
                        'type': ref.kind().longname(),
                        'line': ref.line(),
                        'column': ref.column()
                    })
                    rel_count += 1

    all_rel_kinds = set()
    for rel in rel_list:
        all_rel_kinds.add(rel['type'])

    print('Saving results to the file...')
    with open(args.out, 'w') as out:
        json.dump(rel_list, out, indent=4)
    print(f'Total {rel_count} relations are successfully exported')
    print('All possible relation types are', sorted(all_rel_kinds))