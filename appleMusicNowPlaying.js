// NAME: Apple Music Now Playing
// AUTHOR: ray
// VERSION: 1.0.0
// DESCRIPTION: Apple Music-style fullscreen now playing for Spicetify.

/// <reference path="../globals.d.ts" />
(function AppleMusicNowPlaying() {
	if (!Spicetify.Player || !Spicetify.React || !Spicetify.ReactDOM || !Spicetify.Keyboard) {
		setTimeout(AppleMusicNowPlaying, 200);
		return;
	}

	const { React: react, ReactDOM: reactDOM } = Spicetify;
	const { useState, useEffect, useRef, useMemo } = react;

	const STYLE = `
#amnp-root {
	position: fixed;
	inset: 0;
	z-index: 10000;
	overflow: hidden;
	cursor: default;
	font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif;
	color: #fff;
	user-select: none;
}
#amnp-root.hide-cursor { cursor: none; }
#amnp-bg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	display: block;
	z-index: 0;
	pointer-events: none;
}
#amnp-bg-dim {
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.12);
	z-index: 1;
}
#amnp-layout {
	position: relative;
	z-index: 2;
	height: 100%;
	display: grid;
	grid-template-columns: 50% 50%;
	align-items: center;
}
#amnp-left {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 6vh 0;
	width: 100%;
	min-width: 0;
}
#amnp-art {
	width: min(50vh, 38vw);
	aspect-ratio: 1;
	border-radius: max(2%, 8px);
	background-size: cover;
	background-position: center;
	box-shadow: 0 1em 1.2em rgba(0, 0, 0, 0.19);
	transform: scale(1);
	transition: transform 0.5s cubic-bezier(0.3, 0.2, 0.2, 1.4), box-shadow 0.5s ease;
}
#amnp-art.paused {
	transform: scale(0.94);
	box-shadow: 0 0.8em 0.8em rgba(0, 0, 0, 0.19);
}
#amnp-meta {
	width: min(50vh, 38vw);
	margin-top: 28px;
	mix-blend-mode: plus-lighter;
}
#amnp-meta-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 10px;
}
#amnp-title {
	font-size: 16px;
	font-weight: 600;
	letter-spacing: 0.2px;
	line-height: 1.2;
	color: rgba(255, 255, 255, 0.94);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
#amnp-artist {
	margin-top: 3px;
	font-size: 12px;
	font-weight: 400;
	letter-spacing: 0.2px;
	color: rgba(255, 255, 255, 0.45);
	line-height: 1.25;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
#amnp-favs {
	display: flex;
	align-items: center;
	gap: 2px;
	flex-shrink: 0;
	margin-top: -1px;
}
#amnp-heart {
	background: none;
	border: 0;
	padding: 0;
	width: 28px;
	height: 28px;
	color: rgba(255, 255, 255, 0.55);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
}
#amnp-heart.on { color: #fff; }
#amnp-heart svg { display: block; }
#amnp-progress-wrap {
	display: flex;
	flex-direction: column;
	margin-top: 28px;
	width: 100%;
}
#amnp-bar {
	width: 100%;
	height: 18px;
	display: flex;
	align-items: center;
	cursor: pointer;
}
#amnp-bar-track {
	width: 100%;
	height: 4px;
	border-radius: 100px;
	background: rgba(255, 255, 255, 0.22);
	overflow: hidden;
	transition: height 0.22s ease;
}
#amnp-bar:hover #amnp-bar-track { height: 7px; }
#amnp-bar-inner {
	height: 100%;
	border-radius: 100px;
	background: #fff;
}
#amnp-times {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 8px;
	font-size: 11px;
	font-weight: 500;
	font-variant-numeric: tabular-nums;
	color: rgba(255, 255, 255, 0.5);
	letter-spacing: 0.01em;
}
#amnp-controls {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	margin-top: 22px;
}
#amnp-controls button {
	background: none;
	border: 0;
	padding: 0;
	width: 48px;
	height: 48px;
	color: #fff;
	cursor: pointer;
	opacity: 0.92;
	display: flex;
	align-items: center;
	justify-content: center;
}
#amnp-controls button.edge {
	opacity: 0.5;
	width: 44px;
	height: 44px;
}
#amnp-controls button.edge.on { opacity: 1; }
#amnp-controls button.repeat-one { position: relative; }
#amnp-controls button.repeat-one::after {
	content: "1";
	position: absolute;
	right: 3px;
	bottom: 4px;
	font-size: 10px;
	font-weight: 700;
	line-height: 1;
}
#amnp-controls button.play { opacity: 1; }
#amnp-controls button:active svg { transform: scale(0.88); }
#amnp-controls svg { display: block; }
#amnp-right {
	height: 100%;
	min-height: 100%;
	align-self: stretch;
	min-width: 0;
	position: relative;
	overflow: hidden;
}
#amnp-lyrics-viewport {
	position: absolute;
	inset: 0;
	padding: 0 8vw 0 0;
	overflow: hidden;
	mix-blend-mode: plus-lighter;
	touch-action: none;
}
#amnp-lyrics {
	position: relative;
	height: 100%;
}
.amnp-line {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	font-size: max(6.2vh, 3.2vw);
	font-weight: 700;
	letter-spacing: -0.03em;
	line-height: 1.2;
	text-align: left;
	color: #fff;
	padding: 0.42em 0;
	cursor: pointer;
	transform-origin: left center;
	will-change: transform, filter, opacity;
	transition: opacity 0.4s ease, filter 0.4s ease;
}
.amnp-line.empty {
	opacity: 0 !important;
	filter: none !important;
	pointer-events: none;
	height: 0.9em;
	padding: 0;
}
.amnp-line-text {
	display: block;
}
.amnp-line-trans {
	display: block;
	margin-top: 0.16em;
	font-size: 0.38em;
	font-weight: 500;
	letter-spacing: 0.01em;
	line-height: 1.35;
	color: rgba(255, 255, 255, 0.72);
}
#amnp-empty-lyrics {
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	color: rgba(255, 255, 255, 0.28);
	font-size: 28px;
	font-weight: 500;
	padding-left: 0;
	mix-blend-mode: plus-lighter;
}
.amnp-loading-dots {
	display: flex;
	align-items: center;
	gap: 11px;
}
.amnp-loading-dots i {
	width: 9px;
	height: 9px;
	border-radius: 50%;
	background: #fff;
	opacity: 0.16;
	transform: scale(0.86);
	animation: amnp-dot 1.6s ease-in-out infinite;
}
.amnp-loading-dots i:nth-child(2) { animation-delay: 0.18s; }
.amnp-loading-dots i:nth-child(3) { animation-delay: 0.36s; }
@keyframes amnp-dot {
	0%, 80%, 100% { opacity: 0.14; transform: scale(0.86); }
	40% { opacity: 0.5; transform: scale(1); }
}
#amnp-corner {
	position: absolute;
	right: 22px;
	bottom: 18px;
	z-index: 5;
	display: flex;
	align-items: center;
	gap: 14px;
	mix-blend-mode: plus-lighter;
}
#amnp-lyric-source {
	display: flex;
	align-items: center;
	gap: 6px;
	pointer-events: none;
	color: rgba(255, 255, 255, 0.34);
}
#amnp-lyric-source svg,
#amnp-insight-btn svg {
	display: block;
	flex-shrink: 0;
	opacity: 0.9;
}
#amnp-lyric-source span,
#amnp-insight-btn span,
#amnp-trans-btn span {
	font-size: 10px;
	font-weight: 500;
	letter-spacing: 0.06em;
	line-height: 1;
}
#amnp-insight-btn,
#amnp-trans-btn {
	background: none;
	border: 0;
	padding: 0;
	display: flex;
	align-items: center;
	gap: 6px;
	color: rgba(255, 255, 255, 0.4);
	cursor: pointer;
	font: inherit;
}
#amnp-insight-btn:hover,
#amnp-insight-btn.on,
#amnp-trans-btn:hover,
#amnp-trans-btn.on {
	color: rgba(255, 255, 255, 0.82);
}
#amnp-insight {
	position: absolute;
	top: 6vh;
	right: 3.5vw;
	bottom: 9vh;
	width: min(42vw, 560px);
	z-index: 5;
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding: 32px 34px 26px;
	border-radius: 24px;
	background: rgba(16, 16, 16, 0.46);
	backdrop-filter: blur(40px) saturate(1.15);
	box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
	color: rgba(255, 255, 255, 0.88);
}
#amnp-insight-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
}
#amnp-insight-title {
	font-size: 13px;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.46);
}
#amnp-insight-song {
	margin-top: 6px;
	font-size: 18px;
	font-weight: 650;
	letter-spacing: -0.02em;
	color: rgba(255, 255, 255, 0.92);
}
#amnp-insight-close {
	background: none;
	border: 0;
	padding: 0;
	width: 28px;
	height: 28px;
	color: rgba(255, 255, 255, 0.45);
	cursor: pointer;
	font-size: 22px;
	line-height: 1;
}
#amnp-insight-body {
	flex: 1;
	overflow-y: auto;
	user-select: text;
	font-size: 16px;
	font-weight: 500;
	line-height: 1.7;
	letter-spacing: 0.01em;
	color: rgba(255, 255, 255, 0.86);
}
#amnp-insight-body p {
	margin: 0 0 1em;
}
#amnp-insight-body p:last-child {
	margin-bottom: 0;
}
.amnp-insight-hook {
	font-size: 18px;
	font-weight: 600;
	letter-spacing: -0.02em;
	line-height: 1.45;
	color: rgba(255, 255, 255, 0.94);
	margin: 0 0 1.15em;
}
.amnp-insight-kicker {
	margin: 1.15em 0 0.4em;
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.38);
}
.amnp-insight-kicker:first-child {
	margin-top: 0;
}
.amnp-insight-image {
	margin: 0 0 0.85em;
}
.amnp-insight-quote {
	margin: 0 0 0.25em;
	font-size: 14px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.62);
}
.amnp-insight-caveat {
	margin-top: 1.2em;
	font-size: 13px;
	line-height: 1.55;
	color: rgba(255, 255, 255, 0.42);
}
#amnp-insight-key {
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-top: 8px;
}
#amnp-insight-key input {
	width: 100%;
	border: 0;
	outline: none;
	border-radius: 12px;
	padding: 12px 14px;
	background: rgba(255, 255, 255, 0.1);
	color: #fff;
	font-size: 14px;
}
#amnp-insight-key button {
	align-self: flex-start;
	border: 0;
	border-radius: 100px;
	padding: 8px 16px;
	background: rgba(255, 255, 255, 0.92);
	color: #111;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
}
#amnp-insight-hint,
#amnp-insight-error {
	font-size: 13px;
	line-height: 1.55;
	color: rgba(255, 255, 255, 0.48);
}
#amnp-insight-error { color: rgba(255, 190, 190, 0.86); }
#amnp-insight-foot {
	margin-top: auto;
	font-size: 11px;
	color: rgba(255, 255, 255, 0.32);
	cursor: pointer;
}
`

	function loadCoverImage(url) {
		return new Promise((resolve, reject) => {
			if (!url) {
				resolve(null);
				return;
			}
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = reject;
			image.src = url;
		});
	}

	function FluidBackground({ src }) {
		const canvasRef = useRef(null);

		useEffect(() => {
			const canvas = canvasRef.current;
			if (!canvas || !src) return;
			const ctx = canvas.getContext("2d", { alpha: false });
			const scene = document.createElement("canvas");
			const sceneCtx = scene.getContext("2d", { alpha: false });
			let image = null;
			let raf = 0;
			let last = performance.now();
			let time = 0;
			const rot = [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2];
			const flowSpeed = 1;
			const fpsInterval = 1000 / 24;

			const resize = () => {
				const scale = 0.42;
				const width = Math.max(2, Math.round(canvas.clientWidth * scale));
				const height = Math.max(2, Math.round(canvas.clientHeight * scale));
				canvas.width = width;
				canvas.height = height;
				scene.width = width;
				scene.height = height;
			};
			resize();
			const observer = new ResizeObserver(resize);
			observer.observe(canvas);

			loadCoverImage(src).then((loaded) => {
				image = loaded;
			});

			const drawSprite = (x, y, size, rotation) => {
				if (!image) return;
				sceneCtx.save();
				sceneCtx.translate(x, y);
				sceneCtx.rotate(rotation);
				sceneCtx.drawImage(image, -size / 2, -size / 2, size, size);
				sceneCtx.restore();
			};

			const tick = (now) => {
				raf = requestAnimationFrame(tick);
				if (now - last < fpsInterval) return;
				const delta = Math.min(2.2, (now - last) / 16.667);
				last = now;
				time += delta * flowSpeed;
				const width = canvas.width;
				const height = canvas.height;
				const maxSize = Math.max(width, height);
				sceneCtx.fillStyle = "#111";
				sceneCtx.fillRect(0, 0, width, height);
				if (image) {
					rot[0] += (delta / 1000) * flowSpeed;
					rot[1] -= (delta / 500) * flowSpeed;
					rot[2] += (delta / 1000) * flowSpeed;
					rot[3] -= (delta / 750) * flowSpeed;
					drawSprite(width / 2, height / 2, maxSize * Math.SQRT2, rot[0]);
					drawSprite(width / 2.5, height / 2.5, maxSize * 0.8, rot[1]);
					drawSprite(
						width / 2 + (width / 4) * Math.cos((time / 1000) * 0.75),
						height / 2 + (width / 4) * Math.cos((time / 1000) * 0.75),
						maxSize * 0.5,
						rot[2]
					);
					drawSprite(
						width / 2 + (width / 4) * 0.1 + Math.cos(time * 0.006 * 0.75),
						height / 2 + (width / 4) * 0.1 + Math.cos(time * 0.006 * 0.75),
						maxSize * 0.25,
						rot[3]
					);
				}
				ctx.filter = "blur(28px) saturate(1.2) brightness(0.58) contrast(0.82)";
				ctx.drawImage(scene, 0, 0, width, height);
				ctx.filter = "none";
			};
			raf = requestAnimationFrame(tick);
			return () => {
				cancelAnimationFrame(raf);
				observer.disconnect();
			};
		}, [src]);

		return react.createElement("canvas", { id: "amnp-bg", ref: canvasRef });
	}

	function createSpring(mass = 0.9, damping = 15, stiffness = 90) {
		let pos = 0;
		let vel = 0;
		let target = 0;
		let pending = null;
		let unlockAt = 0;
		return {
			setTarget(next, delay = 0) {
				if (delay > 0) {
					pending = next;
					unlockAt = performance.now() + delay * 1000;
					return;
				}
				if (pending != null && performance.now() < unlockAt) {
					pending = next;
					return;
				}
				target = next;
			},
			snap(next) {
				pos = next;
				vel = 0;
				target = next;
				pending = null;
			},
			update(dt, now = performance.now()) {
				if (pending != null && now >= unlockAt) {
					target = pending;
					pending = null;
				}
				const acc = (stiffness * (target - pos) - damping * vel) / mass;
				vel += acc * dt;
				pos += vel * dt;
				return pos;
			},
			current() {
				return pos;
			},
		};
	}

	function computeLineBlur(index, activeIndex) {
		if (activeIndex < 0 || index === activeIndex) return 0;
		let blurLevel = 1;
		if (index < activeIndex) blurLevel += Math.abs(activeIndex - index) + 1;
		else blurLevel += Math.abs(index - activeIndex);
		return blurLevel;
	}

	function formatTime(ms) {
		if (!Number.isFinite(ms) || ms < 0) ms = 0;
		return Spicetify.Player.formatTime(ms);
	}

	function parseLRC(lrc) {
		if (!lrc) return [];
		const lines = [];
		for (const raw of lrc.split(/\r?\n/)) {
			const stamps = [...raw.matchAll(/\[(\d+):(\d+)(?:[.:](\d+))?\]/g)];
			const text = raw.replace(/\[(\d+):(\d+)(?:[.:](\d+))?\]/g, "").trim();
			if (!stamps.length) continue;
			for (const stamp of stamps) {
				const msPart = stamp[3] ? stamp[3].padEnd(3, "0").slice(0, 3) : "0";
				lines.push({
					startTime: Number(stamp[1]) * 60000 + Number(stamp[2]) * 1000 + Number(msPart),
					text: text || "",
				});
			}
		}
		return lines.sort((a, b) => a.startTime - b.startTime);
	}

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function withTimeout(promise, ms = 8000) {
		return Promise.race([
			promise,
			new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
		]);
	}

	function decodeBase64Utf8(content) {
		const bytes = Uint8Array.from(atob(content), (char) => char.charCodeAt(0));
		return new TextDecoder("utf-8").decode(bytes);
	}

	function isCreditLine(text) {
		return /^(作词|作曲|编曲|制作人?|词|曲)\s*[:：]/.test(text);
	}

	function usableLines(lines) {
		const filtered = (lines || []).filter((line) => line.text && line.text !== "♪" && !isCreditLine(line.text));
		return filtered.length ? filtered : null;
	}

	function plainToLines(text) {
		const lines = (text || "")
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => ({ startTime: null, text: line }));
		return usableLines(lines);
	}

	function lrcToLines(lrc) {
		if (!lrc || lrc.includes("纯音乐")) return null;
		return usableLines(parseLRC(lrc));
	}

	function decodeMaybeLrc(value) {
		if (!value || typeof value !== "string") return "";
		if (!value.includes("[") && /^[A-Za-z0-9+/=\s]+$/.test(value) && value.length > 40) {
			try {
				return decodeBase64Utf8(value.replace(/\s/g, ""));
			} catch {}
		}
		return value;
	}

	function linesHaveTranslation(lines) {
		return (lines || []).some((line) => line.translation);
	}

	function lyricsNeedChinese(lines) {
		const text = (lines || []).map((line) => line.text).join("");
		const han = (text.match(/\p{Script=Han}/gu) || []).length;
		const latin = (text.match(/[A-Za-z]/g) || []).length;
		return latin >= 12 && han * 2 < latin;
	}

	function mergeTranslations(lines, transLines) {
		if (!lines?.length || !transLines?.length) return lines;
		const next = lines.map((line) => ({ ...line }));
		const timed = next[0].startTime != null && transLines[0].startTime != null;
		if (timed) {
			for (const line of next) {
				let best = null;
				let bestDelta = 450;
				for (const item of transLines) {
					const delta = Math.abs((item.startTime || 0) - (line.startTime || 0));
					if (delta < bestDelta && item.text) {
						bestDelta = delta;
						best = item;
					}
				}
				if (best) line.translation = best.text;
			}
		} else {
			const count = Math.min(next.length, transLines.length);
			for (let i = 0; i < count; i++) {
				if (transLines[i].text) next[i].translation = transLines[i].text;
			}
		}
		return next;
	}

	function cleanTitle(title) {
		return (title || "")
			.replace(/-\s+(feat|with|prod).*/i, "")
			.replace(/(\(|\[)(feat|with|prod)\.?\s+.*(\)|\])$/i, "")
			.replace(/\s-\s.*/, "")
			.replace(/\s*\((deluxe|remaster(ed)?|radio edit|live|explicit|clean).*?\)/gi, "")
			.replace(/\s+/g, " ")
			.trim() || title || "";
	}

	function primaryArtist(name) {
		return (name || "").split(/,|&|\/| feat\.? | featuring /i)[0].trim();
	}

	function trackQuery(meta) {
		let title = meta.title || "";
		let artist = primaryArtist(meta.artist_name || "");
		const dashed = title.match(/^(.*?)[-–—](.+)$/);
		if (dashed) {
			const left = dashed[1].trim();
			const right = dashed[2].trim();
			if (artist && (right === artist || right.includes(artist) || artist.includes(right))) title = left;
		}
		return { title: cleanTitle(title), artist, album: meta.album_title || "" };
	}

	function durationFits(localSecs, remoteSecs) {
		if (!localSecs || !remoteSecs) return true;
		return Math.abs(localSecs - remoteSecs) <= 5;
	}

	function linesFromLrclibBody(body) {
		if (!body || body.instrumental) return null;
		if (body.syncedLyrics) {
			const lines = lrcToLines(body.syncedLyrics);
			if (lines) return lines;
		}
		if (body.plainLyrics) return plainToLines(body.plainLyrics);
		return null;
	}

	async function lrclibRequest(url) {
		const headers = { "x-user-agent": `spicetify v${Spicetify.Config.version} (https://github.com/spicetify/cli)` };
		let res = await fetch(url, { headers });
		if (res.status === 503) {
			await sleep(800);
			res = await fetch(url, { headers });
			if (res.status === 503) return { overload: true, body: null };
		}
		if (!res.ok) return { overload: false, body: null };
		return { overload: false, body: await res.json() };
	}

	function lrclibUrl(path, artist, title, album, durationSecs) {
		const params = new URLSearchParams({ track_name: title, artist_name: artist });
		if (album) params.set("album_name", album);
		if (durationSecs >= 1 && durationSecs <= 3600) params.set("duration", String(Math.round(durationSecs * 100) / 100));
		return `https://lrclib.net/api/${path}?${params}`;
	}

	async function fetchSpotifyLyrics(uri) {
		const id = uri?.split(":")[2];
		if (!id) return null;
		const body = await Spicetify.CosmosAsync.get(
			`https://spclient.wg.spotify.com/color-lyrics/v2/track/${id}?format=json&vocalRemoval=false&market=from_token`
		);
		const lyrics = body?.lyrics;
		if (!lyrics?.lines?.length) return null;
		const lines = lyrics.lines
			.map((line) => ({
				startTime: lyrics.syncType === "LINE_SYNCED" ? Number(line.startTimeMs) || 0 : null,
				text: line.words || "",
			}))
			.filter((line) => line.text && line.text !== "♪");
		return lines.length ? lines : null;
	}

	async function fetchLrclibLyrics(meta, durationMs) {
		const { title, artist, album } = trackQuery(meta);
		const durationSecs = (durationMs || 0) / 1000;
		if (!title) return null;
		const urls = [
			...new Set([
				lrclibUrl("get", artist, title, album, durationSecs),
				lrclibUrl("get", artist, title, "", durationSecs),
				lrclibUrl("get", artist, title, "", 0),
				lrclibUrl("search", artist, title, "", 0),
			]),
		];
		for (const url of urls) {
			const { overload, body } = await lrclibRequest(url);
			if (overload) return null;
			if (Array.isArray(body)) {
				const ranked = body
					.map((item) => ({
						item,
						delta: Math.abs((item.duration || 0) - durationSecs),
						synced: !!item.syncedLyrics,
					}))
					.sort((a, b) => Number(b.synced) - Number(a.synced) || a.delta - b.delta);
				const best = ranked.find((entry) => durationFits(durationSecs, entry.item.duration)) || ranked[0];
				const lines = linesFromLrclibBody(best?.item);
				if (lines) return lines;
			} else {
				const lines = linesFromLrclibBody(body);
				if (lines) return lines;
			}
		}
		return null;
	}

	async function fetchLrcCxLyrics(meta) {
		const { title, artist, album } = trackQuery(meta);
		if (!title) return null;
		const params = new URLSearchParams({ title, artist });
		if (album) params.set("album", album);
		const url = `https://api.lrc.cx/lyrics?${params}`;
		try {
			const res = await fetch(url);
			if (res.ok) {
				const text = await res.text();
				if (text && !text.startsWith("{")) return lrcToLines(text);
			}
		} catch {}
		try {
			const body = await Spicetify.CosmosAsync.get(url);
			const text = typeof body === "string" ? body : "";
			if (text && !text.startsWith("{")) return lrcToLines(text);
		} catch {}
		return null;
	}

	async function fetchKugouLyrics(meta, durationMs) {
		const { title, artist } = trackQuery(meta);
		if (!title || !artist) return null;
		const headers = { "User-Agent": "Mozilla/5.0" };
		const search = await Spicetify.CosmosAsync.get(
			`https://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${encodeURIComponent(`${artist} - ${title}`)}&duration=${Math.round(durationMs || 0)}&hash=`,
			null,
			headers
		);
		const candidates = search?.candidates || [];
		if (!candidates.length) return null;
		const durationSecs = (durationMs || 0) / 1000;
		const hit =
			candidates.find(
				(item) =>
					(item.song || "") === title &&
					(item.singer || "").includes(artist) &&
					durationFits(durationSecs, (item.duration || 0) / 1000)
			) ||
			candidates.find((item) => (item.song || "") === title && (item.singer || "").includes(artist)) ||
			null;
		if (!hit?.id || !hit.accesskey) return null;
		const body = await Spicetify.CosmosAsync.get(
			`https://lyrics.kugou.com/download?ver=1&client=pc&id=${hit.id}&accesskey=${hit.accesskey}&fmt=lrc&charset=utf8`,
			null,
			headers
		);
		const content = body?.content;
		if (!content) return null;
		const lrc = decodeBase64Utf8(content);
		return lrcToLines(lrc);
	}

	function pickNeteaseSong(songs, title, artist, album, durationMs) {
		let best = null;
		let bestScore = 0;
		for (const song of songs) {
			const name = song.name || "";
			const singers = (song.artists || song.ar || []).map((item) => item.name).join(" ");
			const albumName = (song.album || song.al || {}).name || "";
			const duration = song.duration || song.dt || 0;
			if (/翻自|翻唱/.test(name) && !singers.includes(artist)) continue;
			let score = 0;
			if (name === title) score += 5;
			else if (name.includes(title)) score += 2;
			if (singers.includes(artist)) score += 5;
			if (album && albumName.toLowerCase() === album.toLowerCase()) score += 3;
			if (Math.abs(duration - durationMs) < 3000) score += 4;
			if (score > bestScore) {
				bestScore = score;
				best = song;
			}
		}
		return bestScore >= 5 ? best : null;
	}

	async function fetchNeteaseLyricPack(meta, durationMs) {
		const { title, artist, album } = trackQuery(meta);
		if (!title) return null;
		const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0" };
		const queries = [
			`https://music.xianqiao.wang/neteaseapiv2/search?limit=10&type=1&keywords=${encodeURIComponent(`${title} ${artist}`)}`,
			`https://music.163.com/api/cloudsearch/pc?s=${encodeURIComponent(`${title} ${artist}`)}&type=1&limit=10`,
		];
		let song = null;
		for (const url of queries) {
			try {
				const search = await Spicetify.CosmosAsync.get(url, null, headers);
				const songs = search?.result?.songs || [];
				song = pickNeteaseSong(songs, title, artist, album, durationMs);
				if (song) break;
			} catch {}
		}
		if (!song?.id) return null;
		const lyricUrls = [
			`https://music.xianqiao.wang/neteaseapiv2/lyric?id=${song.id}`,
			`https://music.163.com/api/song/lyric?id=${song.id}&lv=1&kv=1&tv=-1`,
		];
		for (const url of lyricUrls) {
			try {
				const body = await Spicetify.CosmosAsync.get(url, null, headers);
				const lines = lrcToLines(body?.lrc?.lyric);
				const trans = lrcToLines(body?.tlyric?.lyric);
				if (lines || trans) return { lines, trans };
			} catch {}
		}
		return null;
	}

	async function fetchNeteaseLyrics(meta, durationMs) {
		const pack = await fetchNeteaseLyricPack(meta, durationMs);
		if (!pack?.lines) return null;
		return mergeTranslations(pack.lines, pack.trans);
	}

	async function fetchQqLyricPack(meta, durationMs) {
		const { title, artist } = trackQuery(meta);
		if (!title || !artist) return null;
		const headers = { Referer: "https://y.qq.com", "User-Agent": "Mozilla/5.0" };
		const payload = {
			req_1: {
				method: "DoSearchForQQMusicDesktop",
				module: "music.search.SearchCgiService",
				param: { num_per_page: 8, page_num: 1, query: `${title} ${artist}`, search_type: 0 },
			},
		};
		const search = await Spicetify.CosmosAsync.get(
			`https://u.y.qq.com/cgi-bin/musicu.fcg?data=${encodeURIComponent(JSON.stringify(payload))}`,
			null,
			headers
		);
		const songs = search?.req_1?.data?.body?.song?.list || [];
		const durationSecs = (durationMs || 0) / 1000;
		const hit =
			songs.find((song) => {
				const name = song.name || song.title || "";
				const singers = (song.singer || []).map((item) => item.name).join(" ");
				return name === title && singers.includes(artist) && durationFits(durationSecs, song.interval);
			}) ||
			songs.find((song) => {
				const name = song.name || song.title || "";
				const singers = (song.singer || []).map((item) => item.name).join(" ");
				return name === title && singers.includes(artist);
			});
		if (!hit) return null;
		const mid = hit.mid || hit.songmid;
		const body = await Spicetify.CosmosAsync.get(
			`https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${mid}&g_tk=5381&format=json&nobase64=1`,
			null,
			headers
		);
		const lines = lrcToLines(decodeMaybeLrc(body?.lyric));
		const trans = lrcToLines(decodeMaybeLrc(body?.trans));
		if (lines || trans) return { lines, trans };
		return null;
	}

	async function fetchQqLyrics(meta, durationMs) {
		const pack = await fetchQqLyricPack(meta, durationMs);
		if (!pack?.lines) return null;
		return mergeTranslations(pack.lines, pack.trans);
	}

	async function loadLyrics() {
		const item = Spicetify.Player.data?.item;
		if (!item) return { lines: [], source: "" };
		const meta = item.metadata || {};
		const duration = Spicetify.Platform.PlayerAPI._state.duration || 0;
		const sources = [
			{ name: "Spotify", fetch: () => fetchSpotifyLyrics(item.uri) },
			{ name: "LRCLIB", fetch: () => fetchLrclibLyrics(meta, duration) },
			{ name: "LRC.cx", fetch: () => fetchLrcCxLyrics(meta) },
			{ name: "酷狗", fetch: () => fetchKugouLyrics(meta, duration) },
			{ name: "网易云", fetch: () => fetchNeteaseLyrics(meta, duration) },
			{ name: "QQ", fetch: () => fetchQqLyrics(meta, duration) },
		];
		for (const source of sources) {
			try {
				const lines = await withTimeout(source.fetch());
				if (lines?.length) return { lines, source: source.name };
			} catch {}
		}
		return { lines: [], source: "" };
	}

	const DEEPSEEK_KEY = "amnp-deepseek-key";

	function getDeepseekKey() {
		return (localStorage.getItem(DEEPSEEK_KEY) || "").trim();
	}

	function saveDeepseekKey(key) {
		localStorage.setItem(DEEPSEEK_KEY, (key || "").trim());
	}

	function extractChatText(data) {
		return (data?.choices?.[0]?.message?.content || "").trim();
	}

	function insightCacheKey(uri) {
		return `${uri || ""}::v2`;
	}

	function lyricsPrompt(track, lines) {
		const lyrics = (lines || []).map((line) => line.text).filter(Boolean).join("\n");
		return `歌曲：${track.title || "未知"}
歌手：${track.artist || "未知"}
专辑：${track.album || "未知"}

歌词：
${lyrics || "（暂无歌词，请只根据歌名、歌手与专辑理解。）"}`;
	}

	function parseInsight(raw) {
		if (!raw) return null;
		const fenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
		const match = fenced.match(/\{[\s\S]*\}/);
		if (match) {
			try {
				const data = JSON.parse(match[0]);
				if (data && (data.hook || data.story || data.images)) return data;
			} catch {}
		}
		return { story: raw };
	}

	function renderInsight(data) {
		if (!data) return null;
		const blocks = [];
		const addSection = (label, value, key) => {
			if (!value) return;
			blocks.push(react.createElement("div", { className: "amnp-insight-kicker", key: `${key}-k` }, label));
			blocks.push(react.createElement("p", { key }, value));
		};
		if (data.hook) blocks.push(react.createElement("p", { className: "amnp-insight-hook", key: "hook" }, data.hook));
		addSection("在讲什么", data.story, "story");
		addSection("情绪", data.mood, "mood");
		if (Array.isArray(data.images) && data.images.length) {
			blocks.push(react.createElement("div", { className: "amnp-insight-kicker", key: "images-k" }, "意象"));
			data.images.forEach((item, index) => {
				const quote = item?.quote || "";
				const note = item?.note || "";
				if (!quote && !note) return;
				blocks.push(
					react.createElement(
						"div",
						{ className: "amnp-insight-image", key: `img-${index}` },
						quote ? react.createElement("div", { className: "amnp-insight-quote" }, quote) : null,
						note ? react.createElement("p", null, note) : null
					)
				);
			});
		}
		addSection("更深一层", data.deeper, "deeper");
		if (data.caveat) blocks.push(react.createElement("div", { className: "amnp-insight-caveat", key: "caveat" }, data.caveat));
		return blocks.length ? blocks : null;
	}

	async function interpretWithDeepseek(track, lines) {
		const key = getDeepseekKey();
		if (!key) throw new Error("NO_KEY");
		const body = {
			model: "deepseek-chat",
			temperature: 0.55,
			max_tokens: 1800,
			messages: [
				{
					role: "system",
					content: `你是歌词释义编辑，写法接近 Songtell / Lyrithm：解释「这首歌在说什么」，不是读后感，也不是中学赏析套话。
只输出一个 JSON 对象，不要 Markdown、不要代码围栏：
{
  "hook": "一句话点破这首歌真正在说的事，要具体，禁止空泛的『关于爱情与离别』『表达了思念』",
  "story": "2到4句：谁在对谁说话、处在什么处境、叙事怎么推进。紧贴歌词里的场景、人称和细节。",
  "mood": "情绪如何从开头走到结尾，转折落在哪类句子或意象上。",
  "images": [
    {"quote": "原词短引，不超过22字", "note": "这个意象在本歌里具体指向什么，为什么出现或反复"}
  ],
  "deeper": "第二层读法：自我欺骗、反讽、身份、时代或城市生活。必须能从歌词推出来；推不出来就写『歌词没有给出足够线索』。禁止编造艺人生平、访谈、专辑概念、社会事件。",
  "caveat": "可选。歌词残缺、明显是翻唱/现场、或有多种读法时，用一句话标明。"
}
images 选 3 到 5 个信息量最大的意象，不要逐句翻译。禁止鸡汤、emoji、把副歌复述成主题。`,
				},
				{ role: "user", content: lyricsPrompt(track, lines) },
			],
		};
		const headers = { "Content-Type": "application/json", Authorization: `Bearer ${key}` };
		const urls = ["https://api.deepseek.com/chat/completions", "https://api.deepseek.com/v1/chat/completions"];
		let lastError = new Error("DeepSeek 没有返回内容");
		for (const url of urls) {
			try {
				const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
				const data = await res.json();
				const text = extractChatText(data);
				if (text) return text;
				if (data?.error?.message) lastError = new Error(data.error.message);
			} catch (error) {
				lastError = error;
			}
			try {
				const data = await Spicetify.CosmosAsync.post(url, body, headers);
				const text = extractChatText(data);
				if (text) return text;
				if (data?.error?.message) lastError = new Error(data.error.message);
			} catch (error) {
				lastError = error;
			}
		}
		throw lastError;
	}

	async function deepseekChat(messages, maxTokens = 1800) {
		const key = getDeepseekKey();
		if (!key) throw new Error("NO_KEY");
		const body = { model: "deepseek-chat", temperature: 0.2, max_tokens: maxTokens, messages };
		const headers = { "Content-Type": "application/json", Authorization: `Bearer ${key}` };
		const urls = ["https://api.deepseek.com/chat/completions", "https://api.deepseek.com/v1/chat/completions"];
		let lastError = new Error("DeepSeek 没有返回内容");
		for (const url of urls) {
			try {
				const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
				const data = await res.json();
				const text = extractChatText(data);
				if (text) return text;
				if (data?.error?.message) lastError = new Error(data.error.message);
			} catch (error) {
				lastError = error;
			}
			try {
				const data = await Spicetify.CosmosAsync.post(url, body, headers);
				const text = extractChatText(data);
				if (text) return text;
				if (data?.error?.message) lastError = new Error(data.error.message);
			} catch (error) {
				lastError = error;
			}
		}
		throw lastError;
	}

	async function translateLinesDeepseek(lines) {
		const payload = lines.map((line, index) => `${index}:${line.text}`).join("\n");
		const raw = await deepseekChat(
			[
				{
					role: "system",
					content: "将歌词译为通顺的简体中文，保留原意和语气，不要解释、不要注音。只输出 JSON 数组，项为 {\"i\":行号,\"t\":\"译文\"}。已经是中文的行把 t 留空字符串。",
				},
				{ role: "user", content: payload },
			],
			2200
		);
		const match = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").match(/\[[\s\S]*\]/);
		if (!match) return null;
		const items = JSON.parse(match[0]);
		if (!Array.isArray(items)) return null;
		const next = lines.map((line) => ({ ...line }));
		for (const item of items) {
			const index = Number(item?.i);
			const text = (item?.t || "").trim();
			if (Number.isInteger(index) && next[index] && text) next[index].translation = text;
		}
		return linesHaveTranslation(next) ? next : null;
	}

	async function enrichTranslations(lines, meta, durationMs) {
		if (!lines?.length || linesHaveTranslation(lines)) return null;
		try {
			const pack = await fetchNeteaseLyricPack(meta, durationMs);
			if (pack?.trans?.length) {
				const merged = mergeTranslations(lines, pack.trans);
				if (linesHaveTranslation(merged)) return merged;
			}
		} catch {}
		try {
			const pack = await fetchQqLyricPack(meta, durationMs);
			if (pack?.trans?.length) {
				const merged = mergeTranslations(lines, pack.trans);
				if (linesHaveTranslation(merged)) return merged;
			}
		} catch {}
		if (!lyricsNeedChinese(lines) || !getDeepseekKey()) return null;
		try {
			return await translateLinesDeepseek(lines);
		} catch {}
		return null;
	}

	const LyricSourceMark = ({ source }) => {
		if (!source) return null;
		return react.createElement(
			"div",
			{
				id: "amnp-lyric-source",
				title: `歌词来源：${source}`,
			},
			react.createElement("svg", {
				width: 11,
				height: 11,
				viewBox: "0 0 16 16",
				fill: "currentColor",
				dangerouslySetInnerHTML: {
					__html: '<path d="M4.2 2.4h7.6c.7 0 1.2.5 1.2 1.2v8.8c0 .7-.5 1.2-1.2 1.2H4.2c-.7 0-1.2-.5-1.2-1.2V3.6c0-.7.5-1.2 1.2-1.2zm.8 3.1c0-.3.2-.5.5-.5h5c.3 0 .5.2.5.5s-.2.5-.5.5h-5c-.3 0-.5-.2-.5-.5zm0 2.4c0-.3.2-.5.5-.5h5c.3 0 .5.2.5.5s-.2.5-.5.5h-5c-.3 0-.5-.2-.5-.5zm0 2.4c0-.3.2-.5.5-.5h3.2c.3 0 .5.2.5.5s-.2.5-.5.5H5.5c-.3 0-.5-.2-.5-.5z"/>',
				},
			}),
			react.createElement("span", null, source)
		);
	};

	const InsightPanel = ({ track, status, text, error, onClose, onSaveKey, onResetKey }) => {
		const [draftKey, setDraftKey] = useState("");
		const insight = parseInsight(text);
		const paragraphs = (text || "").split(/\n{2,}|\n/).map((part) => part.trim()).filter(Boolean);
		return react.createElement(
			"div",
			{
				id: "amnp-insight",
				onDoubleClick: (event) => event.stopPropagation(),
				onPointerDown: (event) => event.stopPropagation(),
			},
			react.createElement(
				"div",
				{ id: "amnp-insight-head" },
				react.createElement(
					"div",
					null,
					react.createElement("div", { id: "amnp-insight-title" }, "AI解读"),
					react.createElement("div", { id: "amnp-insight-song" }, track.title || "当前歌曲")
				),
				react.createElement("button", { id: "amnp-insight-close", onClick: onClose }, "×")
			),
			status === "need-key"
				? react.createElement(
						"div",
						{ id: "amnp-insight-key" },
						react.createElement("div", { id: "amnp-insight-hint" }, "第一次使用需要 DeepSeek API Key，保存在本地，只会用来解读当前歌词。"),
						react.createElement("input", {
							type: "password",
							placeholder: "粘贴 DeepSeek API Key",
							value: draftKey,
							onChange: (event) => setDraftKey(event.target.value),
							onDoubleClick: (event) => event.stopPropagation(),
						}),
						react.createElement(
							"button",
							{
								onClick: () => {
									if (draftKey.trim()) onSaveKey(draftKey.trim());
								},
							},
							"开始 AI解读"
						),
						react.createElement(
							"div",
							{ id: "amnp-insight-hint" },
							"在 DeepSeek 开放平台创建：platform.deepseek.com/api_keys"
						)
				  )
				: status === "loading"
					? react.createElement(
							"div",
							{ id: "amnp-insight-body" },
							react.createElement(
								"div",
								{ className: "amnp-loading-dots", "aria-hidden": "true" },
								react.createElement("i"),
								react.createElement("i"),
								react.createElement("i")
							)
					  )
					: status === "error"
						? react.createElement("div", { id: "amnp-insight-error" }, error || "解读失败，请稍后再试。")
						: react.createElement(
								"div",
								{ id: "amnp-insight-body" },
								insight?.hook || insight?.story || insight?.images
									? renderInsight(insight)
									: paragraphs.map((part, index) => react.createElement("p", { key: index }, part))
						  ),
			status === "ready" || status === "error"
				? react.createElement("div", { id: "amnp-insight-foot", onClick: onResetKey }, "更换 DeepSeek API Key")
				: null
		);
	};

	const Glyph = ({ size, viewBox, html }) =>
		react.createElement("svg", {
			width: size,
			height: size,
			viewBox,
			fill: "currentColor",
			xmlns: "http://www.w3.org/2000/svg",
			dangerouslySetInnerHTML: { __html: html },
		});

	const ICONS = {
		play: {
			size: 28,
			viewBox: "0 0 38 38",
			html: '<path d="M5.80762 32.4896V5.4925C5.80762 4.305 6.12305 3.41438 6.75391 2.82063C7.38477 2.22688 8.13932 1.93 9.01758 1.93C9.78451 1.93 10.5391 2.14029 11.2812 2.56086L33.7324 15.6605C34.5859 16.1553 35.223 16.6562 35.6436 17.1634C36.0641 17.6582 36.2744 18.2705 36.2744 19.0003C36.2744 19.7054 36.0641 20.3177 35.6436 20.8372C35.223 21.3444 34.5859 21.8392 33.7324 22.3216L11.2812 35.4212C10.5391 35.8542 9.78451 36.0706 9.01758 36.0706C8.13932 36.0706 7.38477 35.7676 6.75391 35.1614C6.12305 34.5677 5.80762 33.6771 5.80762 32.4896Z"/>',
		},
		pause: {
			size: 26,
			viewBox: "0 0 38 38",
			html: '<path d="M8.46953 37C7.37801 37 6.56603 36.7271 6.03359 36.1814C5.51445 35.6489 5.25488 34.8502 5.25488 33.7854V4.21464C5.25488 3.14975 5.52111 2.35108 6.05355 1.81864C6.59931 1.27288 7.40463 1 8.46953 1H13.3813C14.4329 1 15.2249 1.27288 15.7574 1.81864C16.3031 2.35108 16.576 3.14975 16.576 4.21464V33.7854C16.576 34.8502 16.3031 35.6489 15.7574 36.1814C15.2249 36.7271 14.4329 37 13.3813 37H8.46953ZM24.6426 37C23.5644 37 22.759 36.7271 22.2266 36.1814C21.6942 35.6489 21.4279 34.8502 21.4279 33.7854V4.21464C21.4279 3.14975 21.6942 2.35108 22.2266 1.81864C22.7724 1.27288 23.5777 1 24.6426 1H29.5544C30.6193 1 31.4179 1.27288 31.9504 1.81864C32.4828 2.35108 32.7491 3.14975 32.7491 4.21464V33.7854C32.7491 34.8502 32.4828 35.6489 31.9504 36.1814C31.4179 36.7271 30.6193 37 29.5544 37H24.6426Z"/>',
		},
		prev: {
			size: 32,
			viewBox: "22 42 86 50",
			html: '<path d="M72 60.0717C68.062 62.3453 66.0931 63.4821 65.4323 64.9662C64.8559 66.2608 64.8559 67.7391 65.4323 69.0336C66.0931 70.5177 68.062 71.6545 72 73.9281L93 86.0525C96.938 88.326 98.9069 89.4628 100.523 89.293C101.932 89.1449 103.212 88.4057 104.045 87.2593C105 85.945 105 83.6714 105 79.1243V54.8755C105 50.3284 105 48.0548 104.045 46.7405C103.212 45.5941 101.932 44.8549 100.523 44.7068C98.9069 44.537 96.938 45.6738 93 47.9473L72 60.0717Z"/><path d="M32 60.0717C28.062 62.3453 26.0931 63.4821 25.4323 64.9662C24.8559 66.2608 24.8559 67.7391 25.4323 69.0336C26.0931 70.5177 28.062 71.6545 32 73.9281L53 86.0525C56.938 88.326 58.9069 89.4628 60.5226 89.293C61.9319 89.1449 63.2122 88.4057 64.0451 87.2593C65 85.945 65 83.6714 65 79.1243V54.8755C65 50.3284 65 48.0548 64.0451 46.7405C63.2122 45.5941 61.9319 44.8549 60.5226 44.7068C58.9069 44.537 56.938 45.6738 53 47.9473L32 60.0717Z"/>',
		},
		next: {
			size: 32,
			viewBox: "26 42 86 50",
			html: '<path d="M62 60.0717C65.938 62.3453 67.9069 63.4821 68.5677 64.9662C69.1441 66.2608 69.1441 67.7391 68.5677 69.0336C67.9069 70.5177 65.938 71.6545 62 73.9281L41 86.0525C37.062 88.326 35.0931 89.4628 33.4774 89.293C32.0681 89.1449 30.7878 88.4057 29.9549 87.2593C29 85.945 29 83.6714 29 79.1243V54.8755C29 50.3284 29 48.0548 29.9549 46.7405C30.7878 45.5941 32.0681 44.8549 33.4774 44.7068C35.0931 44.537 37.062 45.6738 41 47.9473L62 60.0717Z"/><path d="M102 60.0717C105.938 62.3453 107.907 63.4821 108.568 64.9662C109.144 66.2608 109.144 67.7391 108.568 69.0336C107.907 70.5177 105.938 71.6545 102 73.9281L81 86.0525C77.062 88.326 75.0931 89.4628 73.4774 89.293C72.0681 89.1449 70.7878 88.4057 69.9549 87.2593C69 85.945 69 83.6714 69 79.1243V54.8755C69 50.3284 69 48.0548 69.9549 46.7405C70.7878 45.5941 72.0681 44.8549 73.4774 44.7068C75.0931 44.537 77.062 45.6738 81 47.9473L102 60.0717Z"/>',
		},
		shuffle: {
			size: 27,
			viewBox: "0 0 56 56",
			html: '<path d="M10.624 36.3125C10.624 35.75 10.8218 35.2754 11.2173 34.8887C11.6216 34.4932 12.1094 34.2954 12.6807 34.2954H15.4756C16.3896 34.2954 17.1455 34.1372 17.7432 33.8208C18.3496 33.5044 18.9341 32.9946 19.4966 32.2915L27.3936 22.3379C28.3955 21.0811 29.4282 20.2285 30.4917 19.7803C31.5552 19.332 32.79 19.1079 34.1963 19.1079H36.4243V16.1548C36.4243 15.6714 36.5605 15.2935 36.833 15.021C37.1055 14.7397 37.479 14.5991 37.9536 14.5991C38.1821 14.5991 38.3843 14.6343 38.5601 14.7046C38.7446 14.7749 38.9072 14.8672 39.0479 14.9814L44.8223 19.8857C45.1826 20.1846 45.3628 20.5493 45.3628 20.98C45.3628 21.4106 45.1826 21.7754 44.8223 22.0742L39.0479 26.9917C38.9072 27.106 38.7446 27.2026 38.5601 27.2817C38.3843 27.3521 38.1821 27.3872 37.9536 27.3872C37.479 27.3872 37.1055 27.2466 36.833 26.9653C36.5605 26.6841 36.4243 26.3018 36.4243 25.8184V23.1421H33.9194C33.3218 23.1421 32.8076 23.2036 32.377 23.3267C31.9551 23.4497 31.564 23.6562 31.2036 23.9463C30.8521 24.2275 30.4829 24.6143 30.0962 25.1064L21.606 35.7061C20.8853 36.6113 20.0986 37.2749 19.2461 37.6968C18.3936 38.1099 17.3389 38.3164 16.082 38.3164H12.6807C12.1094 38.3164 11.6216 38.123 11.2173 37.7363C10.8218 37.3496 10.624 36.875 10.624 36.3125ZM10.624 21.125C10.624 20.5625 10.8218 20.0879 11.2173 19.7012C11.6216 19.3057 12.1094 19.1079 12.6807 19.1079H15.7261C16.9829 19.1079 18.0947 19.3188 19.0615 19.7407C20.0371 20.1538 20.8853 20.8174 21.606 21.7314L30.0435 32.2783C30.5972 32.9727 31.1992 33.4824 31.8496 33.8076C32.5 34.1328 33.291 34.2954 34.2227 34.2954H36.4243V31.5664C36.4243 31.083 36.5605 30.7007 36.833 30.4194C37.1055 30.1382 37.479 29.9976 37.9536 29.9976C38.1821 29.9976 38.3843 30.0371 38.5601 30.1162C38.7446 30.1865 38.9072 30.2832 39.0479 30.4062L44.8223 35.2974C45.1826 35.5962 45.3628 35.9609 45.3628 36.3916C45.3628 36.8223 45.1826 37.187 44.8223 37.4858L39.0479 42.3901C38.9072 42.5132 38.7446 42.6099 38.5601 42.6802C38.3843 42.7593 38.1821 42.7988 37.9536 42.7988C37.479 42.7988 37.1055 42.6582 36.833 42.377C36.5605 42.0957 36.4243 41.7134 36.4243 41.23V38.3164H34.1699C32.9043 38.3164 31.7222 38.1011 30.6235 37.6704C29.5249 37.231 28.5625 36.4927 27.7363 35.4556L19.4966 25.146C18.9341 24.4429 18.2925 23.9331 17.5718 23.6167C16.8599 23.3003 16.0381 23.1421 15.1064 23.1421H12.6807C12.1094 23.1421 11.6216 22.9443 11.2173 22.5488C10.8218 22.1533 10.624 21.6787 10.624 21.125Z"/>',
		},
		repeat: {
			size: 27,
			viewBox: "0 0 56 56",
			html: '<path d="M14.2495 28.9956C13.6519 28.9956 13.1465 28.7891 12.7334 28.376C12.3203 27.9541 12.1138 27.4531 12.1138 26.873V25.3438C12.1138 23.832 12.4565 22.5312 13.1421 21.4414C13.8276 20.3516 14.8076 19.5166 16.082 18.9365C17.3564 18.3477 18.877 18.0532 20.6436 18.0532H30.3599V15.4033C30.3599 14.9111 30.4961 14.5288 30.7686 14.2563C31.041 13.9751 31.4146 13.8345 31.8892 13.8345C32.1177 13.8345 32.3198 13.874 32.4956 13.9531C32.6714 14.0234 32.8296 14.1113 32.9702 14.2168L38.7578 19.1343C39.1182 19.4331 39.2939 19.7979 39.2852 20.2285C39.2852 20.6504 39.1094 21.0107 38.7578 21.3096L32.9702 26.2271C32.8296 26.3501 32.6714 26.4468 32.4956 26.5171C32.3198 26.5874 32.1177 26.6226 31.8892 26.6226C31.4146 26.6226 31.041 26.4819 30.7686 26.2007C30.4961 25.9194 30.3599 25.5415 30.3599 25.0669V22.1929H20.459C19.1846 22.1929 18.1826 22.5269 17.4531 23.1948C16.7236 23.8628 16.3589 24.7812 16.3589 25.9502V26.873C16.3589 27.4531 16.1523 27.9541 15.7393 28.376C15.3262 28.7891 14.8296 28.9956 14.2495 28.9956ZM41.7505 26.7017C42.3306 26.7017 42.8271 26.9082 43.2402 27.3213C43.6621 27.7344 43.873 28.2354 43.873 28.8242V30.3535C43.873 31.8652 43.5303 33.166 42.8447 34.2559C42.1592 35.3457 41.1792 36.1851 39.9048 36.7739C38.6304 37.354 37.1055 37.644 35.3301 37.644H25.627V40.2676C25.627 40.751 25.4907 41.1333 25.2183 41.4146C24.9458 41.6958 24.5723 41.8364 24.0977 41.8364C23.8691 41.8364 23.6626 41.7969 23.478 41.7178C23.3022 41.6475 23.1484 41.5552 23.0166 41.4409L17.2158 36.5366C16.873 36.2466 16.6973 35.8862 16.6885 35.4556C16.6885 35.0249 16.8643 34.6558 17.2158 34.3481L23.0166 29.4307C23.1484 29.3164 23.3022 29.2241 23.478 29.1538C23.6626 29.0835 23.8691 29.0483 24.0977 29.0483C24.5723 29.0483 24.9458 29.189 25.2183 29.4702C25.4907 29.7427 25.627 30.125 25.627 30.6172V33.4912H35.5278C36.8022 33.4912 37.8042 33.1616 38.5337 32.5024C39.2632 31.8345 39.6279 30.916 39.6279 29.7471V28.8242C39.6279 28.2354 39.8301 27.7344 40.2344 27.3213C40.6475 26.9082 41.1528 26.7017 41.7505 26.7017Z"/>',
		},
		star: {
			size: 22,
			viewBox: "0 0 24 24",
			html: '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" d="M12 2.8 14.07 9.15 20.75 9.16 15.35 13.09 17.41 19.44 12 15.52 6.59 19.44 8.65 13.09 3.25 9.16 9.93 9.15Z"/>',
		},
		starOn: {
			size: 22,
			viewBox: "0 0 24 24",
			html: '<path d="M12 2.8 14.07 9.15 20.75 9.16 15.35 13.09 17.41 19.44 12 15.52 6.59 19.44 8.65 13.09 3.25 9.16 9.93 9.15Z"/>',
		},
		sparkle: {
			size: 13,
			viewBox: "0 0 24 24",
			html: '<path d="M12 2.2 13.35 7.1 18.2 8.4 13.35 9.7 12 14.6 10.65 9.7 5.8 8.4 10.65 7.1Z"/><path d="M18.7 13.4 19.45 16.1 22.1 16.85 19.45 17.6 18.7 20.3 17.95 17.6 15.3 16.85 17.95 16.1Z"/>',
		},
	};

	const renderIcon = (name) => react.createElement(Glyph, ICONS[name]);

	const Progress = () => {
		const [progress, setProgress] = useState(Spicetify.Player.getProgress());
		const [duration, setDuration] = useState(Spicetify.Platform.PlayerAPI._state.duration || 1);
		const barRef = useRef(null);
		const dragging = useRef(false);

		useEffect(() => {
			const onProgress = ({ data }) => {
				if (!dragging.current) setProgress(data);
				setDuration(Spicetify.Platform.PlayerAPI._state.duration || 1);
			};
			Spicetify.Player.addEventListener("onprogress", onProgress);
			return () => Spicetify.Player.removeEventListener("onprogress", onProgress);
		}, []);

		const seekFromEvent = (event) => {
			const rect = barRef.current.getBoundingClientRect();
			const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
			const next = ratio * duration;
			setProgress(next);
			return next;
		};

		return react.createElement(
			"div",
			{ id: "amnp-progress-wrap" },
			react.createElement(
				"div",
				{
					id: "amnp-bar",
					ref: barRef,
					onClick: (event) => Spicetify.Player.seek(seekFromEvent(event)),
					onMouseDown: (event) => {
						dragging.current = true;
						seekFromEvent(event);
						const move = (e) => seekFromEvent(e);
						const up = (e) => {
							dragging.current = false;
							Spicetify.Player.seek(seekFromEvent(e));
							window.removeEventListener("mousemove", move);
							window.removeEventListener("mouseup", up);
						};
						window.addEventListener("mousemove", move);
						window.addEventListener("mouseup", up);
					},
				},
				react.createElement(
					"div",
					{ id: "amnp-bar-track" },
					react.createElement("div", { id: "amnp-bar-inner", style: { width: `${(progress / duration) * 100}%` } })
				)
			),
			react.createElement(
				"div",
				{ id: "amnp-times" },
				react.createElement("span", null, formatTime(progress)),
				react.createElement("span", null, `-${formatTime(Math.max(0, duration - progress))}`)
			)
		);
	};

	const playerState = () => Spicetify.Player.origin?._state || Spicetify.Player.data || {};

	const readShuffle = () => {
		const state = playerState();
		return !!(state.shuffle ?? state.options?.shufflingContext ?? Spicetify.Player.getShuffle?.());
	};

	const readRepeat = () => {
		const state = playerState();
		if (typeof state.repeat === "number") return state.repeat;
		if (state.options?.repeatingTrack) return 2;
		if (state.options?.repeatingContext) return 1;
		return Spicetify.Player.getRepeat?.() ?? 0;
	};

	const clickNativeControl = (testId) => {
		const button = document.querySelector(`[data-testid="${testId}"]`);
		if (!button) return false;
		button.click();
		return true;
	};

	const applyShuffle = async (next) => {
		const api = Spicetify.Platform?.PlayerAPI || Spicetify.Player.origin;
		try {
			if (typeof api?.setShuffle === "function") {
				await api.setShuffle(next);
				return;
			}
		} catch {}
		if (clickNativeControl("control-button-shuffle")) return;
		try {
			Spicetify.Player.setShuffle?.(next);
		} catch {
			Spicetify.Player.toggleShuffle?.();
		}
	};

	const applyRepeat = async (mode) => {
		const api = Spicetify.Platform?.PlayerAPI || Spicetify.Player.origin;
		try {
			if (typeof api?.setRepeat === "function") {
				await api.setRepeat(mode);
				return;
			}
		} catch {}
		for (let i = 0; i < 3 && readRepeat() !== mode; i++) {
			if (!clickNativeControl("control-button-repeat")) break;
		}
		if (readRepeat() !== mode) {
			try {
				Spicetify.Player.setRepeat?.(mode);
			} catch {
				Spicetify.Player.toggleRepeat?.();
			}
		}
	};

	const Controls = () => {
		const [playing, setPlaying] = useState(Spicetify.Player.isPlaying());
		const [shuffle, setShuffle] = useState(readShuffle);
		const [repeat, setRepeat] = useState(readRepeat);
		useEffect(() => {
			const sync = () => {
				setPlaying(Spicetify.Player.isPlaying());
				setShuffle(readShuffle());
				setRepeat(readRepeat());
			};
			Spicetify.Player.addEventListener("onplaypause", sync);
			Spicetify.Player.addEventListener("songchange", sync);
			const events = Spicetify.Player.origin?.getEvents?.();
			const listener = events?.addListener?.("update", sync);
			const timer = setInterval(sync, 800);
			return () => {
				Spicetify.Player.removeEventListener("onplaypause", sync);
				Spicetify.Player.removeEventListener("songchange", sync);
				clearInterval(timer);
				try {
					if (typeof listener === "function") listener();
					else events?.removeListener?.(listener);
				} catch {}
			};
		}, []);
		return react.createElement(
			"div",
			{ id: "amnp-controls" },
			react.createElement(
				"button",
				{
					className: `edge${shuffle ? " on" : ""}`,
					onClick: async (event) => {
						event.stopPropagation();
						const next = !readShuffle();
						setShuffle(next);
						await applyShuffle(next);
						setTimeout(() => setShuffle(readShuffle()), 200);
					},
				},
				renderIcon("shuffle")
			),
			react.createElement("button", { onClick: Spicetify.Player.back }, renderIcon("prev")),
			react.createElement("button", { className: "play", onClick: Spicetify.Player.togglePlay }, renderIcon(playing ? "pause" : "play")),
			react.createElement("button", { onClick: Spicetify.Player.next }, renderIcon("next")),
			react.createElement(
				"button",
				{
					className: `edge${repeat === 2 ? " on repeat-one" : repeat ? " on" : ""}`,
					onClick: async (event) => {
						event.stopPropagation();
						const next = readRepeat() === 2 ? 0 : 2;
						setRepeat(next);
						await applyRepeat(next);
						setTimeout(() => setRepeat(readRepeat()), 200);
					},
				},
				renderIcon("repeat")
			)
		);
	};

	const Lyrics = ({ lines, artRef, status, showTrans }) => {
		const [progress, setProgress] = useState(Spicetify.Player.getProgress());
		const viewportRef = useRef(null);
		const lineRefs = useRef([]);
		const springsRef = useRef([]);
		const lastIndexRef = useRef(-1);
		const activeIndexRef = useRef(-1);
		const userOffsetRef = useRef(0);
		const resumeAtRef = useRef(0);
		const frozenIndexRef = useRef(0);
		const dragRef = useRef({ active: false, lastY: 0, moved: false });

		useEffect(() => {
			const onProgress = ({ data }) => setProgress(data);
			Spicetify.Player.addEventListener("onprogress", onProgress);
			return () => Spicetify.Player.removeEventListener("onprogress", onProgress);
		}, []);

		const activeIndex = useMemo(() => {
			if (!lines.length) return -1;
			if (lines[0].startTime == null) {
				const duration = Spicetify.Platform.PlayerAPI._state.duration || 0;
				if (!duration || lines.length < 2) return 0;
				const t = Math.min(1, Math.max(0, progress / duration));
				return Math.min(lines.length - 1, Math.round(t * (lines.length - 1)));
			}
			let index = 0;
			for (let i = 0; i < lines.length; i++) {
				if (progress >= lines[i].startTime) index = i;
				else break;
			}
			return index;
		}, [lines, progress]);
		activeIndexRef.current = activeIndex;
		const lyricsIdentity = useMemo(() => lines.map((line) => `${line.startTime}|${line.text}`).join("\n"), [lines]);

		const pauseFollow = () => {
			const now = performance.now();
			if (now >= resumeAtRef.current) {
				frozenIndexRef.current = Math.max(0, activeIndexRef.current);
			}
			resumeAtRef.current = now + 2800;
		};

		const resumeFollow = () => {
			userOffsetRef.current = 0;
			resumeAtRef.current = 0;
		};

		useEffect(() => {
			springsRef.current = lines.map((_, i) => {
				const prev = lines[i - 1];
				const interval = prev && lines[i].startTime != null && prev.startTime != null ? lines[i].startTime - prev.startTime : 400;
				const clamped = Math.min(800, Math.max(100, interval));
				const ratio = (1 - (clamped - 100) / 700) ** 0.2;
				const stiffness = 170 + ratio * 50;
				return createSpring(0.9, Math.sqrt(stiffness) * 2.2, stiffness);
			});
			lastIndexRef.current = -1;
			userOffsetRef.current = 0;
			resumeAtRef.current = 0;
			frozenIndexRef.current = 0;
		}, [lyricsIdentity]);

		useEffect(() => {
			const viewport = viewportRef.current;
			if (!viewport || !lines.length) return;
			const onWheel = (event) => {
				event.preventDefault();
				event.stopPropagation();
				pauseFollow();
				userOffsetRef.current -= event.deltaY;
			};
			viewport.addEventListener("wheel", onWheel, { passive: false });
			return () => viewport.removeEventListener("wheel", onWheel);
		}, [lines]);

		useEffect(() => {
			let raf = 0;
			let last = performance.now();
			const tick = (now) => {
				const dt = Math.min(0.033, (now - last) / 1000);
				last = now;
				const currentIndex = Math.max(0, activeIndexRef.current);
				const viewport = viewportRef.current;
				const art = artRef?.current;
				const count = lines.length;
				const nodes = [];
				for (let i = 0; i < count; i++) {
					const node = lineRefs.current[i];
					if (!node) {
						raf = requestAnimationFrame(tick);
						return;
					}
					nodes.push(node);
				}
				if (viewport && nodes.length === count && springsRef.current.length === count) {
					const heights = nodes.map((node) => Math.max(node.offsetHeight, 1));
					const prefixes = [0];
					for (let i = 0; i < heights.length; i++) prefixes.push(prefixes[i] + heights[i]);
					const following = now >= resumeAtRef.current;
					if (following) userOffsetRef.current = 0;
					const focusIndex = Math.max(0, Math.min(count - 1, following ? currentIndex : frozenIndexRef.current));
					const viewBox = viewport.getBoundingClientRect();
					const artBox = art?.getBoundingClientRect();
					const focusY = artBox && artBox.height
						? artBox.top + artBox.height / 2 - viewBox.top
						: viewBox.height * 0.42;
					const activeMid = prefixes[focusIndex] + heights[focusIndex] / 2;
					const maxOffset = activeMid - prefixes[0];
					const minOffset = activeMid - prefixes[Math.max(0, count - 1)];
					userOffsetRef.current = Math.min(maxOffset, Math.max(minOffset, userOffsetRef.current));
					const layoutReady = viewBox.height > 0 && heights.every((h) => h > 1);
					const snap = lastIndexRef.current < 0;
					const indexChanged = following && lastIndexRef.current !== currentIndex;
					let delay = 0;
					let baseDelay = snap || !indexChanged || !following ? 0 : 0.05;
					const positions = [];
					for (let i = 0; i < count; i++) {
						const spring = springsRef.current[i];
						const y = focusY - activeMid + prefixes[i] + userOffsetRef.current;
						if (snap || !layoutReady || !following) spring.snap(y);
						else spring.setTarget(y, indexChanged ? delay : 0);
						positions.push(spring.update(dt, now));
						if (indexChanged && !snap && y + heights[i] >= 0) {
							delay += baseDelay;
							if (i >= focusIndex) baseDelay /= 1.05;
						}
					}
					let visualIndex = currentIndex;
					if (!following) {
						let visualDist = Infinity;
						for (let i = 0; i < count; i++) {
							const dist = Math.abs(positions[i] + heights[i] / 2 - focusY);
							if (dist < visualDist) {
								visualDist = dist;
								visualIndex = i;
							}
						}
					}
					for (let i = 0; i < count; i++) {
						const node = nodes[i];
						const current = positions[i];
						const active = i === visualIndex;
						node.style.transform = `translate3d(0, ${current}px, 0) scale(${active ? 1 : 0.97})`;
						node.style.opacity = active ? "1" : "0.22";
						const blur = computeLineBlur(i, visualIndex);
						node.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
					}
					if (layoutReady && following) lastIndexRef.current = currentIndex;
				}
				raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
			return () => cancelAnimationFrame(raf);
		}, [lines, artRef]);

		if (!lines.length) {
			if (status === "loading") {
				return react.createElement(
					"div",
					{ id: "amnp-empty-lyrics" },
					react.createElement(
						"div",
						{ className: "amnp-loading-dots", "aria-hidden": "true" },
						react.createElement("i"),
						react.createElement("i"),
						react.createElement("i")
					)
				);
			}
			return react.createElement("div", { id: "amnp-empty-lyrics" }, "暂无歌词");
		}

		return react.createElement(
			"div",
			{
				id: "amnp-lyrics-viewport",
				ref: viewportRef,
				onPointerDown: (event) => {
					if (event.button !== 0) return;
					dragRef.current = { active: true, lastY: event.clientY, moved: false };
				},
				onPointerMove: (event) => {
					const drag = dragRef.current;
					if (!drag.active) return;
					const dy = event.clientY - drag.lastY;
					if (!drag.moved && Math.abs(dy) < 8) return;
					if (!drag.moved) {
						drag.moved = true;
						event.currentTarget.setPointerCapture(event.pointerId);
					}
					pauseFollow();
					userOffsetRef.current += dy;
					drag.lastY = event.clientY;
				},
				onPointerUp: (event) => {
					const drag = dragRef.current;
					if (drag.moved) {
						try {
							event.currentTarget.releasePointerCapture(event.pointerId);
						} catch {}
						drag.active = false;
						return;
					}
					drag.active = false;
					const node = event.target.closest?.(".amnp-line");
					const index = Number(node?.dataset?.index);
					const line = Number.isInteger(index) ? lines[index] : null;
					if (line?.startTime != null) {
						resumeFollow();
						Spicetify.Player.seek(line.startTime);
					}
				},
			},
			react.createElement(
				"div",
				{ id: "amnp-lyrics" },
				lines.map((line, index) =>
					react.createElement(
						"div",
						{
							key: `${line.startTime}-${index}`,
							className: `amnp-line${index === activeIndex ? " active" : ""}${line.text ? "" : " empty"}`,
							"data-index": String(index),
							ref: (el) => {
								lineRefs.current[index] = el;
							},
						},
						react.createElement("div", { className: "amnp-line-text" }, line.text || " "),
						showTrans && line.translation
							? react.createElement("div", { className: "amnp-line-trans" }, line.translation)
							: null
					)
				)
			)
		);
	};

	const App = () => {
		const [track, setTrack] = useState(() => {
			const item = Spicetify.Player.data?.item;
			const meta = item?.metadata || {};
			return {
				uri: item?.uri || "",
				title: meta.title || "",
				artist: meta.artist_name || "",
				album: meta.album_title || "",
				cover: meta.image_xlarge_url || meta.image_large_url || "",
				heart: Spicetify.Player.getHeart(),
			};
		});
		const [lines, setLines] = useState([]);
		const [lyricSource, setLyricSource] = useState("");
		const [lyricStatus, setLyricStatus] = useState("loading");
		const [playing, setPlaying] = useState(Spicetify.Player.isPlaying());
		const [insightOpen, setInsightOpen] = useState(false);
		const [insightStatus, setInsightStatus] = useState("idle");
		const [insightText, setInsightText] = useState("");
		const [insightError, setInsightError] = useState("");
		const [showTrans, setShowTrans] = useState(() => localStorage.getItem("amnp-show-trans") !== "0");
		const artRef = useRef(null);
		const lyricsRequestId = useRef(0);
		const insightCache = useRef({});
		const insightRequestId = useRef(0);

		const refreshTrack = () => {
			const item = Spicetify.Player.data?.item;
			const meta = item?.metadata || {};
			setTrack({
				uri: item?.uri || "",
				title: meta.title || "",
				artist: meta.artist_name || "",
				album: meta.album_title || "",
				cover: meta.image_xlarge_url || meta.image_large_url || "",
				heart: Spicetify.Player.getHeart(),
			});
		};

		const runInsight = async (currentTrack, currentLines) => {
			const uri = currentTrack.uri;
			if (insightCache.current[insightCacheKey(uri)]) {
				setInsightText(insightCache.current[insightCacheKey(uri)]);
				setInsightStatus("ready");
				setInsightError("");
				return;
			}
			if (!getDeepseekKey()) {
				setInsightStatus("need-key");
				return;
			}
			const requestId = ++insightRequestId.current;
			setInsightStatus("loading");
			setInsightText("");
			setInsightError("");
			try {
				const text = await interpretWithDeepseek(currentTrack, currentLines);
				if (requestId !== insightRequestId.current) return;
				insightCache.current[insightCacheKey(uri)] = text;
				setInsightText(text);
				setInsightStatus("ready");
			} catch (error) {
				if (requestId !== insightRequestId.current) return;
				if (error?.message === "NO_KEY") {
					setInsightStatus("need-key");
					return;
				}
				setInsightStatus("error");
				setInsightError(error?.message || "解读失败，请稍后再试。");
			}
		};

		useEffect(() => {
			const onSong = async () => {
				const requestId = ++lyricsRequestId.current;
				refreshTrack();
				setLines([]);
				setLyricSource("");
				setLyricStatus("loading");
				setInsightOpen(false);
				setInsightStatus("idle");
				setInsightText("");
				setInsightError("");
				insightRequestId.current += 1;
				const result = await loadLyrics();
				if (requestId !== lyricsRequestId.current) return;
				setLines(result.lines);
				setLyricSource(result.source);
				setLyricStatus(result.lines.length ? "ready" : "empty");
				const meta = Spicetify.Player.data?.item?.metadata || {};
				const duration = Spicetify.Platform.PlayerAPI._state.duration || 0;
				const translated = await enrichTranslations(result.lines, meta, duration);
				if (requestId !== lyricsRequestId.current || !translated) return;
				setLines(translated);
			};
			const onPlayPause = ({ data }) => setPlaying(!data.isPaused);
			onSong();
			Spicetify.Player.addEventListener("songchange", onSong);
			Spicetify.Player.addEventListener("onplaypause", onPlayPause);
			return () => {
				Spicetify.Player.removeEventListener("songchange", onSong);
				Spicetify.Player.removeEventListener("onplaypause", onPlayPause);
			};
		}, []);

		const cover = track.cover ? `url("${track.cover}")` : "none";

		return react.createElement(
			"div",
			{
				id: "amnp-root",
				onDoubleClick: deactivate,
			},
			react.createElement(FluidBackground, { src: track.cover }),
			react.createElement("div", { id: "amnp-bg-dim" }),
			react.createElement(
				"div",
				{ id: "amnp-layout" },
				react.createElement(
					"div",
					{ id: "amnp-left" },
					react.createElement("div", {
						id: "amnp-art",
						ref: artRef,
						className: playing ? "" : "paused",
						style: { backgroundImage: cover },
					}),
					react.createElement(
						"div",
						{ id: "amnp-meta" },
						react.createElement(
							"div",
							{ id: "amnp-meta-row" },
							react.createElement(
								"div",
								{ style: { minWidth: 0, flex: 1 } },
								react.createElement("div", { id: "amnp-title" }, track.title),
								react.createElement("div", { id: "amnp-artist" }, track.album ? `${track.artist} — ${track.album}` : track.artist)
							),
							react.createElement(
								"button",
								{
									id: "amnp-heart",
									className: track.heart ? "on" : "",
									onClick: (event) => {
										event.stopPropagation();
										Spicetify.Player.toggleHeart();
										setTrack((current) => ({ ...current, heart: !current.heart }));
									},
								},
								renderIcon(track.heart ? "starOn" : "star")
							)
						),
						react.createElement(Progress),
						react.createElement(Controls)
					)
				),
				react.createElement(
					"div",
					{ id: "amnp-right" },
					react.createElement(Lyrics, { lines, artRef, status: lyricStatus, showTrans })
				)
			),
			react.createElement(
				"div",
				{ id: "amnp-corner" },
				linesHaveTranslation(lines)
					? react.createElement(
							"button",
							{
								id: "amnp-trans-btn",
								className: showTrans ? "on" : "",
								title: showTrans ? "隐藏译文" : "显示译文",
								onClick: (event) => {
									event.stopPropagation();
									const next = !showTrans;
									setShowTrans(next);
									localStorage.setItem("amnp-show-trans", next ? "1" : "0");
								},
							},
							react.createElement("span", null, "译文")
					  )
					: null,
				react.createElement(
					"button",
					{
						id: "amnp-insight-btn",
						className: insightOpen ? "on" : "",
						title: "AI解读歌词",
						onClick: (event) => {
							event.stopPropagation();
							if (insightOpen) {
								setInsightOpen(false);
								return;
							}
							setInsightOpen(true);
							runInsight(track, lines);
						},
					},
					renderIcon("sparkle"),
					react.createElement("span", null, "AI解读")
				),
				react.createElement(LyricSourceMark, { source: lyricSource })
			),
			insightOpen
				? react.createElement(InsightPanel, {
						track,
						status: insightStatus,
						text: insightText,
						error: insightError,
						onClose: () => setInsightOpen(false),
						onSaveKey: (key) => {
							saveDeepseekKey(key);
							runInsight(track, lines);
						},
						onResetKey: () => {
							saveDeepseekKey("");
							delete insightCache.current[insightCacheKey(track.uri)];
							setInsightText("");
							setInsightStatus("need-key");
						},
				  })
				: null
		);
	};

	const style = document.createElement("style");
	style.id = "amnp-style";
	style.textContent = STYLE;

	const mount = document.createElement("div");
	mount.id = "amnp-mount";

	const bodyClasses = ["video", "video-full-screen", "video-full-window", "video-full-screen--hide-ui"];
	const mousetrap = new Spicetify.Mousetrap();
	let cursorTimer;

	function hideCursorSoon() {
		clearTimeout(cursorTimer);
		const root = document.getElementById("amnp-root");
		if (!root) return;
		root.classList.remove("hide-cursor");
		cursorTimer = setTimeout(() => root.classList.add("hide-cursor"), 2000);
	}

	async function activate() {
		if (!Spicetify.Player.data || document.getElementById("amnp-root")) return;
		document.body.classList.add(...bodyClasses);
		document.body.append(style, mount);
		reactDOM.render(react.createElement(App), mount);
		try {
			await document.documentElement.requestFullscreen();
		} catch {}
		mousetrap.bind("esc", deactivate);
		document.addEventListener("mousemove", hideCursorSoon);
		hideCursorSoon();
	}

	async function deactivate() {
		mousetrap.unbind("esc");
		document.removeEventListener("mousemove", hideCursorSoon);
		clearTimeout(cursorTimer);
		if (document.fullscreenElement || document.webkitIsFullScreen) {
			try {
				await document.exitFullscreen();
			} catch {}
		}
		reactDOM.unmountComponentAtNode(mount);
		style.remove();
		mount.remove();
		document.body.classList.remove(...bodyClasses);
	}

	function toggle() {
		if (document.getElementById("amnp-root")) deactivate();
		else activate();
	}

	Spicetify.Mousetrap.bind("f11", toggle);

	function bindNativeFullscreenButton(button) {
		if (!button || button.dataset.amnpBound) return;
		button.dataset.amnpBound = "1";
		button.addEventListener(
			"click",
			(event) => {
				event.preventDefault();
				event.stopImmediatePropagation();
				toggle();
			},
			true
		);
	}

	function hookNativeFullscreenButton() {
		document.querySelectorAll('[data-testid="fullscreen-mode-button"]').forEach(bindNativeFullscreenButton);
	}

	hookNativeFullscreenButton();
	new MutationObserver(hookNativeFullscreenButton).observe(document.body, { childList: true, subtree: true });
})();
