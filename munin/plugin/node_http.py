#!/usr/bin/python3

"""
This file is a Munin plugin for the munin-http package.

It was taken from the `django-munin` project, licenced under BSD, as the
behavior of these are exactly the same, and updated to Python 3.

All Right Reserved — Columbia Center For New Media Teaching And Learning (CCNMTL).
"""

import sys
import urllib.request, urllib.error, urllib.parse
import os
import base64

url = os.environ["url"]
category = os.environ.get("graph_category", "")
login = os.environ.get("login", "")
password = os.environ.get("password", "")
base64string = base64.encodebytes(f"{login}:{password}".encode()).replace(b"\n", b"").decode()

if len(sys.argv) == 2:
    url = f"{url}?{sys.argv[1]}=1"
    request = urllib.request.Request(url)

    if login != "" and password != "":
        request.add_header("Authorization", f"Basic {base64string}")

    print(urllib.request.urlopen(request).read().decode())

    # they can set the category in the config
    if category != "":
        print(f"graph_category {category}")

else:
    srequest = urllib.request.Request(url)

    if login != "" and password != "":
        srequest.add_header("Authorization", f"Basic {base64string}")

    data = urllib.request.urlopen(srequest).readlines()

    for line in data:
        parts = line.decode().split(" ")
        label = parts[0]
        value = " ".join(parts[1:])
        print( f"{label}.value {value}")
