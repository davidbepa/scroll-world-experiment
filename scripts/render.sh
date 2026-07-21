#!/bin/bash
set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
. "$SCRIPT_DIR/render-common.sh"

usage() {
  echo "Usage: ./scripts/render.sh calibrate|stills|contact-sheet|dives|frames|connectors|encode|verify" >&2
}

stage_calibrate() {
  name=marinemax
  gen_still "$name" || {
    echo "calibrate: still generation failed" >&2
    return 1
  }
  [ -s "$RAW_DIR/still-$name.png" ] || return 1
  cwebp -quiet -q 84 -resize 1800 0 "$RAW_DIR/still-$name.png" -o "$STILL_DIR/$name.webp" || return 1
  [ -s "$STILL_DIR/$name.webp" ] || return 1
  gen_dive "$name" || {
    echo "calibrate: dive generation failed" >&2
    return 1
  }
  [ -s "$RAW_DIR/dive-$name.mp4" ]
}

stage_stills() {
  pending_pids=()
  failed=0

  for name in $NAMES; do
    if [ ! -s "$RAW_DIR/still-$name.png" ]; then
      gen_still "$name" &
      pending_pids[${#pending_pids[@]}]=$!
    fi
  done

  index=0
  while [ "$index" -lt "${#pending_pids[@]}" ]; do
    wait "${pending_pids[$index]}" || true
    index=$((index + 1))
  done

  for name in $NAMES; do
    if [ -s "$RAW_DIR/still-$name.png" ] && \
      cwebp -quiet -q 84 -resize 1800 0 "$RAW_DIR/still-$name.png" -o "$STILL_DIR/$name.webp" && \
      [ -s "$STILL_DIR/$name.webp" ]; then
      echo "stills: $name success"
    else
      echo "stills: $name failure" >&2
      failed=1
    fi
  done

  [ "$failed" -eq 0 ]
}

stage_contact_sheet() {
  for name in $NAMES; do
    if [ ! -s "$RAW_DIR/still-$name.png" ]; then
      echo "contact-sheet: missing still-$name.png" >&2
      return 1
    fi
  done

  ffmpeg -v error -y \
    -i "$RAW_DIR/still-marinemax.png" \
    -i "$RAW_DIR/still-southeast-toyota-finance.png" \
    -i "$RAW_DIR/still-iata.png" \
    -i "$RAW_DIR/still-aspen-snowmass.png" \
    -i "$RAW_DIR/still-honda-powersports.png" \
    -i "$RAW_DIR/still-seaworld.png" \
    -filter_complex "[0:v]scale=768:512[a];[1:v]scale=768:512[b];[2:v]scale=768:512[c];[3:v]scale=768:512[d];[4:v]scale=768:512[e];[5:v]scale=768:512[f];[a][b][c]hstack=inputs=3[top];[d][e][f]hstack=inputs=3[bottom];[top][bottom]vstack=inputs=2[out]" \
    -map "[out]" -frames:v 1 "$RENDER_DIR/contact-sheet.png" || return 1

  [ -s "$RENDER_DIR/contact-sheet.png" ]
}

stage_dives() {
  pending_pids=()
  failed=0

  for name in $NAMES; do
    if [ ! -s "$RAW_DIR/dive-$name.mp4" ]; then
      gen_dive "$name" &
      pending_pids[${#pending_pids[@]}]=$!
    fi
  done

  index=0
  while [ "$index" -lt "${#pending_pids[@]}" ]; do
    wait "${pending_pids[$index]}" || true
    index=$((index + 1))
  done

  for name in $NAMES; do
    if [ -s "$RAW_DIR/dive-$name.mp4" ]; then
      echo "dives: $name success"
    else
      echo "dives: $name failure" >&2
      failed=1
    fi
  done

  [ "$failed" -eq 0 ]
}

stage_frames() {
  failed=0

  for name in $NAMES; do
    input="$RAW_DIR/dive-$name.mp4"
    first="$FRAME_DIR/first-$name.png"
    last="$FRAME_DIR/last-$name.png"
    if [ ! -s "$input" ]; then
      echo "frames: missing dive-$name.mp4" >&2
      failed=1
      continue
    fi
    ffmpeg -v error -y -ss 0 -i "$input" -frames:v 1 "$first" || failed=1
    ffmpeg -v error -y -sseof -0.15 -i "$input" -frames:v 1 "$last" || failed=1
    if [ ! -s "$first" ] || [ ! -s "$last" ]; then
      failed=1
    fi
  done

  [ "$failed" -eq 0 ]
}

stage_connectors() {
  pending_pids=()
  failed=0
  prev=
  number=1

  for name in $NAMES; do
    if [ -z "$prev" ]; then
      prev=$name
      continue
    fi
    if [ ! -s "$FRAME_DIR/last-$prev.png" ] || [ ! -s "$FRAME_DIR/first-$name.png" ]; then
      echo "connectors: missing boundary frames for $prev to $name" >&2
      failed=1
    elif [ ! -s "$RAW_DIR/connector-$number.mp4" ]; then
      gen_connector "$number" "$prev" "$name" &
      pending_pids[${#pending_pids[@]}]=$!
    fi
    prev=$name
    number=$((number + 1))
  done

  index=0
  while [ "$index" -lt "${#pending_pids[@]}" ]; do
    wait "${pending_pids[$index]}" || true
    index=$((index + 1))
  done

  number=1
  while [ "$number" -le 5 ]; do
    if [ -s "$RAW_DIR/connector-$number.mp4" ]; then
      echo "connectors: $number success"
    else
      echo "connectors: $number failure" >&2
      failed=1
    fi
    number=$((number + 1))
  done

  [ "$failed" -eq 0 ]
}

stage_encode() {
  failed=0

  for name in $NAMES; do
    input="$RAW_DIR/dive-$name.mp4"
    output="$VIDEO_DIR/$name.mp4"
    if [ ! -s "$input" ]; then
      echo "encode: missing dive-$name.mp4" >&2
      failed=1
    elif ! encode_video "$input" "$output" || [ ! -s "$output" ]; then
      echo "encode: failed $name.mp4" >&2
      failed=1
    fi
  done

  number=1
  while [ "$number" -le 5 ]; do
    input="$RAW_DIR/connector-$number.mp4"
    output="$VIDEO_DIR/connector-$number.mp4"
    if [ ! -s "$input" ]; then
      echo "encode: missing connector-$number.mp4" >&2
      failed=1
    elif ! encode_video "$input" "$output" || [ ! -s "$output" ]; then
      echo "encode: failed connector-$number.mp4" >&2
      failed=1
    fi
    number=$((number + 1))
  done

  [ "$failed" -eq 0 ]
}

case "${1-}" in
  calibrate) stage_calibrate ;;
  stills) stage_stills ;;
  contact-sheet) stage_contact_sheet ;;
  dives) stage_dives ;;
  frames) stage_frames ;;
  connectors) stage_connectors ;;
  encode) stage_encode ;;
  verify) node "$PROJECT_ROOT/scripts/verify-assets.mjs" ;;
  *)
    usage
    exit 2
    ;;
esac
