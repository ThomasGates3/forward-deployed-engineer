#!/usr/bin/env bash
# Downloads the City Scroll hero assets from Google Drive into public/hero/.
# Requires the Drive files to be "Anyone with the link: Viewer".
set -euo pipefail

DEST="public/hero"
mkdir -p "$DEST/keyframes" "$DEST/frames"
COOKIES="$(mktemp)"
trap 'rm -f "$COOKIES"' EXIT

download() {
  local id="$1" out="$2"
  echo "-> $out"
  rm -f "$COOKIES"
  curl -sSL -c "$COOKIES" -b "$COOKIES" -o "$out" \
    "https://drive.google.com/uc?export=download&id=${id}"

  # Large files return an HTML "can't scan for viruses" page with a confirm token.
  if head -c 1024 "$out" | grep -qi '<html'; then
    local token uuid
    token="$(grep -o 'name="confirm" value="[^"]*"' "$out" | head -1 | sed 's/.*value="//; s/"$//' || true)"
    uuid="$(grep -o 'name="uuid" value="[^"]*"' "$out" | head -1 | sed 's/.*value="//; s/"$//' || true)"
    if [ -z "$token" ]; then
      token="$(grep -o 'confirm=[0-9A-Za-z_-]*' "$out" | head -1 | cut -d= -f2 || true)"
    fi
    if [ -z "$token" ]; then
      # Fall back to the legacy download_warning cookie.
      token="$(awk '/download_warning/ {print $NF}' "$COOKIES" | head -1 || true)"
    fi
    token="${token:-t}"
    local url="https://drive.usercontent.google.com/download?export=download&id=${id}&confirm=${token}"
    [ -n "$uuid" ] && url="${url}&uuid=${uuid}"
    curl -sSL -c "$COOKIES" -b "$COOKIES" -o "$out" "$url"
  fi

  # Still HTML means the file is not link-viewable (or the id is wrong). Fail loudly.
  if head -c 1024 "$out" | grep -qi '<html'; then
    echo "ERROR: $out came back as HTML. Check the Drive file is shared 'Anyone with the link: Viewer' (id $id)." >&2
    rm -f "$out"
    exit 1
  fi
}

download 1Q2BxeZhUK_bDlk33kn5WFPBvGxXXgqGB "$DEST/scroll-city.mp4"
download 1ejRIFnppVMXEGjURy8QNuZ9qChjoD4Zg "$DEST/scroll-city-mobile.mp4"
download 1IOzc39EL5uo0ARjtwWhuC5xfXcKiRmuX "$DEST/poster.jpg"
download 1XXrMOPLA8RW5NpxSyaKG-alzwJqGIRTH "$DEST/poster-mobile.jpg"
download 1vuG9JuJVcMcp3lYuyiSmqbo2QBA28U7S "$DEST/keyframes/stage1-rooftop.jpg"
download 1gaCJUuN6ILQKtgYafkb24qkBPDQ7tmBk "$DEST/keyframes/stage2-drones.jpg"
download 1pED45QoRFz3fxPeITSV3nFxdnblie4g- "$DEST/keyframes/stage3-tower.jpg"
download 1mkUUpinc7kHrM0MBeEJnzdHow7Yy4lbl "$DEST/keyframes/stage4-billboard.jpg"
download 1y34_7HcHQMB4uJEI_FkvRPlH1sDpuNkn "$DEST/keyframes/stage5-terminal.jpg"
download 1W_5j8aevg-VupQ5IA3HJQoXEUaXHFkTW "$DEST/frames.zip"

# frames.zip contains frames/f0001.jpg ... frames/f0485.jpg -> public/hero/frames/
if command -v unzip >/dev/null 2>&1; then
  unzip -oq "$DEST/frames.zip" -d "$DEST"
else
  python3 -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" "$DEST/frames.zip" "$DEST"
fi
rm -f "$DEST/frames.zip"

count="$(ls "$DEST/frames" | grep -c '\.jpg$' || true)"
echo "frames: $count (expected 485)"
[ "$count" -eq 485 ] || { echo "ERROR: expected 485 frames" >&2; exit 1; }
echo "Done. Assets in $DEST/"
