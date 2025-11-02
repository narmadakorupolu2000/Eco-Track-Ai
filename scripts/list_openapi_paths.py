import json, urllib.request
spec = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/openapi.json').read().decode())
paths = sorted(list(spec.get('paths',{}).keys()))
print('Registered paths:', len(paths))
for p in paths:
    print(p)
