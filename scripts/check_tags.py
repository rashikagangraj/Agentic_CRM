import urllib.request
import urllib.error

tags = ['1.0.3', '1.0.6', 'latest']
for tag in tags:
    url = f"https://hub.docker.com/v2/repositories/rashikag/agentic-crm/tags/{tag}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        print(f"Tag {tag}: HTTP {res.getcode()} (Available)")
    except urllib.error.HTTPError as e:
        print(f"Tag {tag}: HTTP {e.code} (Not Found / Error)")
