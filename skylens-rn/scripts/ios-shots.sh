#!/bin/sh
# Captures each reference screen from the running Simulator build.
# usage: ios-shots.sh <udid> <outDir>
set -u
UDID=$1
OUT=$2
mkdir -p "$OUT"
BUNDLE=sk.skylens.app

capture() {
  name=$1
  path=$2
  wait=${3:-7}
  xcrun simctl terminate "$UDID" "$BUNDLE" 2>/dev/null || true
  xcrun simctl launch "$UDID" "$BUNDLE" >/dev/null
  sleep 5
  xcrun simctl openurl "$UDID" "skylens://$path"
  sleep "$wait"
  xcrun simctl io "$UDID" screenshot "$OUT/$name.png"
  echo "captured $name"
}

capture 01_onboarding onboarding
capture 02_location location
capture 03_sky_view sky 12
capture 04_object_detail_andromeda "object/dso%3AM31"
capture 05_tonight tonight 12
capture 06_explore explore
capture 07_time_travel time-travel
capture 08_ar_sky ar 12
capture 09_events events 30
capture 10_pro_paywall pro 8
