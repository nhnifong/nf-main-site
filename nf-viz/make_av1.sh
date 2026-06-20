#!/usr/bin/env bash
#
# Generate AV1-encoded `_av1.mp4` companions for every `.mp4` in a directory.
#
# The video elements on the page list the AV1 source first (smaller, better
# quality) and fall back to the plain H.264 `.mp4` for browsers that can't
# decode AV1. The output stream matches the `codecs=av01.0.05M.08` hint in the
# `<source>` tags (Main profile, level 5.0, 8-bit).
#
# Run this from the nf-viz directory.
#
# Usage:
#   ./make_av1.sh [DIR]
#
# DIR defaults to public/assets. Already-converted `_av1.mp4` files are skipped,
# so the script is safe to re-run.
#
# Notes:
# - `libsvtav1` is the fast AV1 encoder; if your ffmpeg lacks it, swap in
#   `-c:v libaom-av1 -cpu-used 6 -b:v 0` for the codec/preset flags below.
# - `-an` drops audio (these are silent loops); remove it if a clip has sound.
# - Lower CRF for higher quality / larger files, raise it for smaller files.

set -euo pipefail

DIR="${1:-public/assets}"
CRF="${CRF:-30}"

shopt -s nullglob
for f in "$DIR"/*.mp4; do
  case "$f" in *_av1.mp4) continue;; esac
  out="${f%.mp4}_av1.mp4"
  echo "Encoding $f -> $out"
  ffmpeg -y -i "$f" \
    -c:v libsvtav1 -preset 6 -crf "$CRF" \
    -pix_fmt yuv420p \
    -svtav1-params tune=0 \
    -an \
    "$out"
done
