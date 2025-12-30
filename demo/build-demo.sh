#!/bin/bash

# cargo install a2kit
# https://github.com/dfgordon/a2kit

a2kit delete -d demo.dsk -f image.gr
a2kit delete -d demo.dsk -f gr
a2kit put -d demo.dsk -f image.gr -t bin -a 400 < image.gr
a2kit tokenize -t atxt -a 2049 < gr.abas | a2kit put -d demo.dsk -t atok -f gr

a2kit delete -d demo.dsk -f image.dgr
a2kit delete -d demo.dsk -f dgr
a2kit tokenize -t atxt -a 2049 < dgr.abas | a2kit put -d demo.dsk -t atok -f dgr
a2kit put -d demo.dsk -f image.dgr -t bin -a 400 < image.dgr

a2kit delete -d demo.dsk -f image.hgr
a2kit delete -d demo.dsk -f hgr
a2kit tokenize -t atxt -a 2049 < hgr.abas | a2kit put -d demo.dsk -t atok -f hgr
a2kit put -d demo.dsk -f image.hgr -t bin -a 2000 < image.hgr

a2kit delete -d demo.dsk -f image.dhgr
a2kit delete -d demo.dsk -f dhgr
a2kit tokenize -t atxt -a 2049 < dhgr.abas | a2kit put -d demo.dsk -t atok -f dhgr
a2kit put -d demo.dsk -f image.dhgr -t bin -a 2000 < image.dhgr

a2kit delete -d demo.dsk -f image.pixmap
a2kit delete -d demo.dsk -f pixmap
a2kit tokenize -t atxt -a 2049 < pixmap.abas | a2kit put -d demo.dsk -t atok -f pixmap
a2kit put -d demo.dsk -f image.pixmap -t bin -a 2000 < image.pixmap

a2kit delete -d demo.dsk -f image.bitmap
a2kit delete -d demo.dsk -f bitmap
a2kit tokenize -t atxt -a 2049 < bitmap.abas | a2kit put -d demo.dsk -t atok -f bitmap
a2kit put -d demo.dsk -f image.bitmap -t bin -a 2000 < image.bitmap

# on windows: https://github.com/AppleWin/AppleWin
# applewin -d1 demo.dsk
# on linux: https://github.com/audetto/AppleWin
# sa2 --d1 demo.dsk
# ... or else
