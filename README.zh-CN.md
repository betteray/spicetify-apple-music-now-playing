# Apple Music Now Playing

[English](README.md) | **中文**

Spicetify 扩展：在 Spotify 里用接近 Apple Music 全屏的方式显示封面、歌词和控制条。

当前版本：**1.0.0**

## 功能

- 左侧封面、歌名、艺人 / 专辑、进度条和控制按钮
- 右侧同步歌词：当前行居中，上下行淡出并带跟随滚动
- 封面模糊流体背景
- 歌词优先用 Spotify 官方同步歌词，没有时回退到 [LRCLIB](https://lrclib.net)
- 顶栏按钮或 `F11` 进入 / 退出全屏，`Esc` 或双击画面退出

## 要求

- [Spicetify](https://spicetify.app) **v2.45+**
- 已用 Spicetify 打过补丁的 Spotify 桌面版（macOS / Windows / Linux）

## 安装

1. 把 `appleMusicNowPlaying.js` 复制到 Spicetify 扩展目录：

   ```bash
   # macOS / Linux
   cp appleMusicNowPlaying.js ~/.config/spicetify/Extensions/

   # Windows
   copy appleMusicNowPlaying.js %userprofile%\.config\spicetify\Extensions\
   ```

2. 启用扩展并应用：

   ```bash
   spicetify config extensions appleMusicNowPlaying.js
   spicetify apply
   ```

   如果之前开过官方 `fullAppDisplay.js`，建议先关掉，避免两个全屏叠在一起：

   ```bash
   spicetify config extensions fullAppDisplay.js-
   spicetify apply
   ```

3. **完全退出 Spotify 再打开**（只关窗口不够）。

## 使用

1. 播放任意歌曲。
2. 点 Spotify 顶栏的投影仪按钮（`Apple Music Display`），或按 `F11`。
3. 退出：再按 `F11`、按 `Esc`，或双击全屏画面。

全屏里可以：

- 点歌词某一行跳转到对应时间
- 拖动进度条、切歌、播放 / 暂停
- 点星星收藏当前曲目
- 开关随机播放和循环

## 更新

覆盖扩展目录里的同名文件后执行：

```bash
spicetify refresh -e
```

然后完全退出并重新打开 Spotify。

## 版本

| 版本 | 说明 |
| --- | --- |
| 1.0.0 | 封面 / 控制条 / 跟随滚动歌词的第一版可用实现 |
| 0.0.1 | 早期快照，见 `snapshots/appleMusicNowPlaying.v0.0.1.js` |

## 说明

布局、歌词弹簧和错峰滚动参考了公开的 [applemusic-like-lyrics (AMLL)](https://github.com/amll-dev/applemusic-like-lyrics) 与 Apple Music Web LyricsScene 资料，不是对 Apple Music.app 原生二进制的逆向。

图标来自 AMLL 的播放控制 SVG。

## 许可

MIT
