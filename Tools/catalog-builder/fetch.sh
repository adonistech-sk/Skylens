#!/bin/sh
# Downloads the primary sources build.mjs reads. Usage: fetch.sh <rawDir>
set -e
dir="${1:?usage: fetch.sh <rawDir>}"
mkdir -p "$dir"
cd "$dir"

heasarc=https://heasarc.gsfc.nasa.gov/FTP/heasarc/dbase/tdat_files
for table in heasarc_hipparcos heasarc_bsc5p heasarc_ngc2000 heasarc_messier; do
  curl -fsSL -o "$table.tdat.gz" "$heasarc/$table.tdat.gz"
  gzip -df "$table.tdat.gz"
done

curl -fsSL -o IAU-CSN.txt https://www.pas.rochester.edu/~emamajek/WGSN/IAU-CSN.txt

d3=https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data
for file in constellations.json constellations.lines.json constellations.bounds.json; do
  curl -fsSL -o "$file" "$d3/$file"
done
