"""Run inside Blender to rebuild, check, export, save and photograph models.

    RUN_MODEL_PATH = r'<repo>/tools/blender/run_model.py'; NAMES = ['cafe-exterior']; exec(open(RUN_MODEL_PATH).read())

Each name is built by tools/blender/models/<name>.py (or by a group script listed in GROUPS),
saved to art/blender/<name>.blend, checked and exported with the Runway add-on into world/models/,
and photographed into review/<name>-front.png and review/<name>-game.png.
Set EXPORT = False to build and save without exporting.
"""
import os
_TOOLS = os.path.dirname(RUN_MODEL_PATH)
_ROOT = os.path.dirname(os.path.dirname(_TOOLS))
_ART = os.path.join(_ROOT, 'art', 'blender')
_WORLD = os.path.join(_ROOT, 'world', 'models')
_REVIEW = os.path.join(_ROOT, 'review')

# name -> (add-on type, add-on role, review picture kind)
ROLES = {
    'cafe-exterior': ('building', 'business:cafe', 'building'),
    'saas-exterior': ('building', 'business:saas', 'building'),
    'shop-exterior': ('building', 'business:shop', 'building'),
    'agency-exterior': ('building', 'business:agency', 'building'),
    'idea-exterior': ('building', 'business:idea', 'building'),
    'kiosk': ('building', 'kiosk', 'building'), 'bank': ('building', 'bank', 'building'),
    'library': ('building', 'library', 'building'), 'investors': ('building', 'investors', 'building'),
    'house': ('building', 'house', 'building'),
    'tree': ('prop', 'tree', 'prop'), 'bench': ('prop', 'bench', 'prop'), 'crate': ('prop', 'crate', 'prop'),
    'avatar': ('person', 'avatar', 'person'),
    'cafe-interior': ('interior', 'interior:cafe', 'interior'),
    'saas-interior': ('interior', 'interior:saas', 'interior'),
    'shop-interior': ('interior', 'interior:shop', 'interior'),
    'agency-interior': ('interior', 'interior:agency', 'interior'),
    'staff-barista': ('person', 'staff:cafe', 'person'),
    'staff-developer': ('person', 'staff:saas', 'person'),
    'staff-packer': ('person', 'staff:shop', 'person'),
    'staff-designer': ('person', 'staff:agency', 'person'),
}
for _f in ('cafe-table', 'espresso-basic', 'espresso-pro', 'office-desk', 'server-rack', 'warehouse-shelf',
           'packing-bench', 'parcel', 'design-desk'):
    ROLES[_f] = ('prop', 'furniture', 'prop')
for _v in ('ponytail', 'cap', 'bighair', 'child', 'teen', 'elder', 'slim', 'broad', 'round', 'glasses',
           'backpack', 'headphones', 'stripes', 'tshirt', 'overalls'):
    ROLES['townsperson-' + _v] = ('person', 'townsperson', 'person')
# street kit: the add-on has no role for these yet, so they are built and saved but not exported
for _s in ('street-lamp', 'bin', 'planter', 'bollard', 'hydrant', 'traffic-light', 'street-sign', 'mailbox',
           'bike-rack', 'bus-stop', 'road-straight', 'road-crosswalk', 'road-intersection'):
    ROLES[_s] = (None, None, 'prop')

# models built by a shared script: script file -> how it builds one name
GROUPS = {'street-props': [k for k, v in ROLES.items() if v[0] is None],
          'townsperson-variants': [k for k in ROLES if k.startswith('townsperson-')]}

_g = {'__file__': os.path.join(_TOOLS, 'runway_build_helpers.py')}
exec(open(_g['__file__']).read(), _g)
_g['ART'] = _ART
RESULTS = {}
for _name in (NAMES if 'NAMES' in globals() else [NAME]):
    _script = next((s for s, ns in GROUPS.items() if _name in ns), _name)
    _g['ONLY'] = [_name]
    _g['SAVE_IN_SCRIPT'] = False
    exec(open(os.path.join(_TOOLS, 'models', _script + '.py')).read(), _g)
    _g['save'](_ART, _name)
    _t, _r, _k = ROLES.get(_name, (None, None, 'prop'))
    _errs, _warns = ([], [])
    if _t and (globals().get('EXPORT', True)):
        _errs, _warns = _g['rt_export'](_t, _r, _name, _WORLD)
        _g['save'](_ART, _name)
    _g['review_shots'](_name, _k, _REVIEW)
    RESULTS[_name] = dict(tris=_g['LAST_CHECK'].get('tris'), errors=_errs, warnings=_warns)
print('RESULTS', RESULTS)
