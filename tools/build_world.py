#!/usr/bin/env python3
"""Build the game page, world/index.html, from its source files.

    python3 tools/build_world.py                 # writes world/index.html
    python3 tools/build_world.py --artifact out.html   # also writes a Claude artifact copy

Sources (edit these, not world/index.html):
    world/src/head.html     page title and font links
    world/src/base.css      shared base styles
    world/src/town.css      the town's look (direction D)
    world/src/body.html     the page's HTML (HUD, dock, sheet, modal)
    world/engine/data/*.json  game data: subjects, lessons, levels, difficulty...
    world/engine/engine.js  the simulation: pure, no screen or saving
    world/src/app.js        screens, saving and the 3D town
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, ENG = ROOT / 'world' / 'src', ROOT / 'world' / 'engine'


def read(p):
    return p.read_text(encoding='utf-8')


def data_block():
    files = sorted((ENG / 'data').glob('*.json'))
    if not files:
        return ''
    data = {f.stem.replace('-', '_'): json.loads(read(f)) for f in files}
    body = ',\n'.join(f'  {k}: {json.dumps(v, ensure_ascii=False, separators=(",", ":"))}' for k, v in data.items())
    return '/* ===== Game data (built from world/engine/data/*.json) ===== */\nconst GAME_DATA = {\n' + body + '\n};\n'


def page():
    """The page without its <html>/<head>/<body> wrapper (the artifact form)."""
    return (read(SRC / 'head.html')
            + '<style>\n' + read(SRC / 'base.css') + read(SRC / 'town.css') + '</style>\n'
            + read(SRC / 'body.html') + '<script>\n(function(){\n' + data_block() + read(ENG / 'engine.js')
            + read(SRC / 'app.js') + '</script>\n')


def standalone(src):
    lines = src.split('\n')
    end = lines.index('</style>')
    head = [l for l in lines[:end + 1] if 'claude:viewport-fit-sides' not in l]
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<style>[hidden]{display:none!important}</style>\n'
            + '\n'.join(head) + '\n</head>\n<body>\n' + '\n'.join(lines[end + 1:]) + '</body>\n</html>\n')


if __name__ == '__main__':
    src = page()
    (ROOT / 'world' / 'index.html').write_text(standalone(src), encoding='utf-8')
    print('wrote world/index.html')
    if '--artifact' in sys.argv:
        out = pathlib.Path(sys.argv[sys.argv.index('--artifact') + 1])
        out.write_text(src, encoding='utf-8')
        print('wrote', out)
