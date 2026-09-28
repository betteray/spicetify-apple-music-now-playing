# Apple Music Now Playing

**English** | [中文](README.zh-CN.md)

A [Spicetify](https://spicetify.app) extension that brings an Apple Music-style fullscreen now playing view to Spotify: artwork, lyrics, and playback controls.

Current version: **1.0.0**

## Features

- Album art, title, artist / album, progress bar, and controls on the left
- Synced lyrics on the right: the current line stays centered, nearby lines fade, and the list follows with a staggered scroll
- Fluid blurred artwork background
- Lyrics prefer Spotify’s official synced lyrics, then fall back to [LRCLIB](https://lrclib.net)
- Open or close fullscreen from Spotify’s now-playing fullscreen button or `F11`; exit with `Esc` or a double-click

## Requirements

- [Spicetify](https://spicetify.app) **v2.45+**
- A Spotify desktop client already patched with Spicetify (macOS / Windows / Linux)

## Install

1. Copy `appleMusicNowPlaying.js` into your Spicetify Extensions folder:

   ```bash
   # macOS / Linux
   cp appleMusicNowPlaying.js ~/.config/spicetify/Extensions/

   # Windows
   copy appleMusicNowPlaying.js %userprofile%\.config\spicetify\Extensions\
   ```

2. Enable the extension and apply:

   ```bash
   spicetify config extensions appleMusicNowPlaying.js
   spicetify apply
   ```

   If you already use the official `fullAppDisplay.js`, turn it off first so the two fullscreen UIs do not stack:

   ```bash
   spicetify config extensions fullAppDisplay.js-
   spicetify apply
   ```

3. **Fully quit Spotify and reopen it** (closing the window is not enough).

## Usage

1. Start playing any track.
2. Click the fullscreen button in Spotify’s now-playing bar, or press `F11`.
3. Exit with `F11` again, `Esc`, or a double-click on the fullscreen view.

In fullscreen you can:

- Click a lyric line to seek to that time
- Drag the progress bar, skip tracks, and play / pause
- Star the current track
- Toggle shuffle and repeat

## Update

Overwrite the same file in your Extensions folder, then run:

```bash
spicetify refresh -e
```

Fully quit Spotify and reopen it.

## Versions

| Version | Notes |
| --- | --- |
| 1.0.0 | First usable release: artwork, controls, and follow-scroll lyrics |
| 0.0.1 | Early snapshot, see `snapshots/appleMusicNowPlaying.v0.0.1.js` |

## Notes

Layout, lyric springs, and staggered scroll are based on the public [applemusic-like-lyrics (AMLL)](https://github.com/amll-dev/applemusic-like-lyrics) project and Apple Music Web LyricsScene writeups. This is not a reverse-engineering of the native Apple Music.app binary.

Control icons come from AMLL’s playback SVGs.

## License

MIT
