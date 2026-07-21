#!/bin/bash
set -u

PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
RENDER_DIR="$PROJECT_ROOT/.render"
PROMPT_DIR="$RENDER_DIR/prompts"
RAW_DIR="$RENDER_DIR/raw"
FRAME_DIR="$RENDER_DIR/frames"
JOB_DIR="$RENDER_DIR/jobs"
STILL_DIR="$PROJECT_ROOT/public/assets/stills"
VIDEO_DIR="$PROJECT_ROOT/public/assets/video"
NAMES="marinemax southeast-toyota-finance iata aspen-snowmass honda-powersports seaworld"
VMODEL="seedance_2_0_mini"
VOPTS="--bitrate_mode standard --generate_audio false --resolution 720p"
DIVE_DUR=8
CONN_DUR=5

mkdir -p "$RAW_DIR" "$FRAME_DIR" "$JOB_DIR" "$STILL_DIR" "$VIDEO_DIR"

result_url() { jq -r '.[0].result_url // empty' "$1"; }

download_result() {
  json=$1
  output=$2
  url=$(result_url "$json")
  [ -n "$url" ] || return 1
  curl -fsSL "$url" -o "$output"
}

gen_still() {
  name=$1
  higgsfield generate create gpt_image_2 --prompt "$(cat "$PROMPT_DIR/still-$name.txt")" \
    --aspect_ratio 16:9 --resolution 2k --quality high --wait --wait-timeout 15m --json \
    > "$JOB_DIR/still-$name.json" 2> "$JOB_DIR/still-$name.err" && \
  download_result "$JOB_DIR/still-$name.json" "$RAW_DIR/still-$name.png"
}

gen_dive() {
  name=$1
  higgsfield generate create "$VMODEL" --prompt "$(cat "$PROMPT_DIR/dive-$name.txt")" \
    --start-image "$RAW_DIR/still-$name.png" $VOPTS --aspect_ratio 16:9 --duration "$DIVE_DUR" \
    --wait --wait-timeout 20m --json > "$JOB_DIR/dive-$name.json" 2> "$JOB_DIR/dive-$name.err" && \
  download_result "$JOB_DIR/dive-$name.json" "$RAW_DIR/dive-$name.mp4"
}

gen_connector() {
  number=$1
  from=$2
  to=$3
  higgsfield generate create "$VMODEL" --prompt "$(cat "$PROMPT_DIR/connector-$number.txt")" \
    --start-image "$FRAME_DIR/last-$from.png" --end-image "$FRAME_DIR/first-$to.png" \
    $VOPTS --aspect_ratio 16:9 --duration "$CONN_DUR" --wait --wait-timeout 20m --json \
    > "$JOB_DIR/connector-$number.json" 2> "$JOB_DIR/connector-$number.err" && \
  download_result "$JOB_DIR/connector-$number.json" "$RAW_DIR/connector-$number.mp4"
}

encode_video() {
  input=$1
  output=$2
  ffmpeg -v error -y -i "$input" -an -vf "unsharp=5:5:0.8:5:5:0.0" \
    -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
    -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$output"
}
