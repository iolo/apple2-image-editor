#!/bin/bash

# prerequisites:
# cargo install a2kit
# https://github.com/dfgordon/a2kit
#
# run on windows: https://github.com/AppleWin/AppleWin
# applewin -d1 demo.dsk
#
# run on linux: https://github.com/audetto/AppleWin
# sa2 --d1 demo.dsk
#
# ... or else

OUTPUT=demo.dsk

BIN_FILES=(
  "image.gr"
  "image.dgr"
  "image.hgr"
  "image.dhgr"
  "i16x16.pixmap"
  "i9x9.pixmap"
  "i16x16.bitmap"
  "i9x9.bitmap"
)
ABAS_FILES=(
  "gr.abas"
  "dgr.abas"
  "hgr.abas"
  "dhgr.abas"
  "pixmap.abas"
  "bitmap.abas"
)

add_bin() {
  a2kit delete -d $OUTPUT -f $1
  a2kit put -d $OUTPUT -f $1 -t bin -a 8192 < $1
}

add_abas() {
  a2kit delete -d $OUTPUT -f $1
  a2kit tokenize -t atxt -a 2049 < $1 | a2kit put -d $OUTPUT -t atok -f $1
}

for file in "${BIN_FILES[@]}"; do
  add_bin "$file"
done
for file in "${ABAS_FILES[@]}"; do
  add_abas "$file"
done

a2kit catalog -d $OUTPUT

