#!/usr/bin/env bash
# Downloads the City Scroll hero assets from Google Drive into public/hero/.
# Requires the Drive files to be "Anyone with the link: Viewer".
set -euo pipefail

DEST="public/hero"
mkdir -p "$DEST/keyframes" "$DEST/frames" public/lobby
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

# Upscaled 1080p city film (2026-11-10) + door/lobby extension (frames 486-606).
download 16Kg9olsffkpAtR1KoTJsV0lrPjX-BPgx "$DEST/scroll-city.mp4"
download 1WioAZVbOxxNBLvRmJH4uJ1H36d-vWba1 "$DEST/scroll-city-mobile.mp4"
download 1OHM3SNDaHDDMrRHykBLM9WOmoyJnSTI5 "$DEST/poster.jpg"
download 1yDc8sscwiARB31BE3St42Mi2PA6FNP6_ "$DEST/poster-mobile.jpg"
download 1pg13NGNUv5z5B85B-o98OTJaCX0pOrt- "$DEST/keyframes/stage1-rooftop.jpg"
download 14nqsidKm8YqOZ3wis4RPR233l1qMsLde "$DEST/keyframes/stage2-drones.jpg"
download 19rxbgBDmV9bZl5qqS_6LhYiapWuiwuP6 "$DEST/keyframes/stage3-tower.jpg"
download 1f9pSjALzvupiKNNLLI6265shx33-wXE9 "$DEST/keyframes/stage4-billboard.jpg"
download 10nxQ-tgojXYyuxnbFYpnxQ4fhntVmt52 "$DEST/keyframes/stage5-terminal.jpg"
download 1jH4eUsDuK6rLdGpIUIIkA-eZ4Cns_Fth "public/lobby/lobby.jpg"
download 1oOAINbpDCkhUL0tMZzr1lOzGBdVu6Js4 "public/lobby/lobby-mobile.jpg"
download 1VDt0gTmaEBO4PrsZZOOlXsmpHJkO4a9D "$DEST/frames.zip"
download 13DSFEtoaX6WLNq1VL4wQv-ddvjFmpX-e "$DEST/door-frames.zip"

# frames.zip -> frames/f0001..f0485.jpg, door-frames.zip -> frames/f0486..f0606.jpg (both into public/hero/frames/)
for z in frames.zip door-frames.zip; do
  if command -v unzip >/dev/null 2>&1; then
    unzip -oq "$DEST/$z" -d "$DEST"
  else
    python3 -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" "$DEST/$z" "$DEST"
  fi
  rm -f "$DEST/$z"
done

count="$(ls "$DEST/frames" | grep -c '\.jpg$' || true)"
echo "frames: $count (expected 606)"
[ "$count" -eq 606 ] || { echo "ERROR: expected 606 frames" >&2; exit 1; }
echo "Done. Assets in $DEST/"
