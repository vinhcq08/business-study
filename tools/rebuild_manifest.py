#!/usr/bin/env python3
"""Rebuild world/models/manifest.json from the .glb files themselves.

Each .glb exported by the Runway add-on carries its role, type and name in the
scene's extras, so the list can always be rebuilt, for example after uploading
files through GitHub without the matching manifest.json.

    python3 tools/rebuild_manifest.py
"""
import glob, json, os, struct, datetime

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'world', 'models')

def read_glb(path):
    b = open(path, 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    return json.loads(b[20:20 + n])

def main():
    path = os.path.join(ROOT, 'manifest.json')
    old = {m['file']: m for m in json.load(open(path)).get('models', [])} if os.path.exists(path) else {}
    models, skipped = [], []
    for f in sorted(glob.glob(os.path.join(ROOT, '*', '*.glb'))):
        rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
        j = read_glb(f)
        ex = j.get('scenes', [{}])[j.get('scene', 0)].get('extras', {})
        if not ex.get('rt_role'):
            skipped.append(rel); continue
        tris = sum(p['indices'] and j['accessors'][p['indices']]['count'] // 3 or 0
                   for m in j.get('meshes', []) for p in m['primitives'] if 'indices' in p)
        prev = old.get(rel, {})
        updated = prev.get('updated') if prev.get('role') == ex['rt_role'] else None
        updated = updated or datetime.date.fromtimestamp(os.path.getmtime(f)).isoformat()
        models.append({'id': ex.get('rt_name') or os.path.basename(f)[:-4], 'file': rel, 'role': ex['rt_role'],
                       'type': ex.get('rt_type', ''), 'tris': tris, 'updated': updated})
    models.sort(key=lambda m: (m['role'], m['file']))
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump({'version': 1, 'models': models}, fh, indent=2); fh.write('\n')
    print(f'{len(models)} models in manifest.json' + (f'; skipped (no role): {skipped}' if skipped else ''))

if __name__ == '__main__':
    main()
