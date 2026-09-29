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
#amnp-empty-lyrics {
	height: 100%;
	display: flex;
	align-items: center;
	color: rgba(255, 255, 255, 0.28);
	font-size: 28px;
	font-weight: 500;
	padding-left: 0;
}
`;

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

	async function fetchSpotifyLyrics(uri) {
		const id = uri?.split(":")[2];
		if (!id) return null;
		const body = await Spicetify.CosmosAsync.get(
			`https://spclient.wg.spotify.com/color-lyrics/v2/track/${id}?format=json&vocalRemoval=false&market=from_token`
		);
		const lyrics = body?.lyrics;
		if (!lyrics?.lines?.length) return null;
		if (lyrics.syncType === "LINE_SYNCED") {
			return lyrics.lines
				.map((line) => ({ startTime: Number(line.startTimeMs) || 0, text: line.words || "" }))
				.filter((line) => line.text && line.text !== "♪");
		}
		return lyrics.lines.map((line) => ({ startTime: null, text: line.words || "" })).filter((line) => line.text);
	}

	async function fetchLrclibLyrics(meta) {
		const params = new URLSearchParams({
			track_name: meta.title || "",
			artist_name: meta.artist_name || "",
			album_name: meta.album_title || "",
			duration: String((Spicetify.Platform.PlayerAPI._state.duration || 0) / 1000),
		});
		const res = await fetch(`https://lrclib.net/api/get?${params}`, {
			headers: { "x-user-agent": `spicetify v${Spicetify.Config.version} (https://github.com/spicetify/cli)` },
		});
		if (!res.ok) return null;
		const body = await res.json();
		if (body.syncedLyrics) return parseLRC(body.syncedLyrics).filter((line) => line.text);
		if (body.plainLyrics) {
			return body.plainLyrics
				.split(/\r?\n/)
				.map((text) => text.trim())
				.filter(Boolean)
				.map((text) => ({ startTime: null, text }));
		}
		return null;
	}

	async function loadLyrics() {
		const item = Spicetify.Player.data?.item;
		if (!item) return [];
		try {
			const spotify = await fetchSpotifyLyrics(item.uri);
			if (spotify?.length) return spotify;
		} catch {}
		try {
			const lrclib = await fetchLrclibLyrics(item.metadata || {});
			if (lrclib?.length) return lrclib;
		} catch {}
		return [];
	}

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

	const Lyrics = ({ lines, artRef }) => {
		const [progress, setProgress] = useState(Spicetify.Player.getProgress());
		const viewportRef = useRef(null);
		const lineRefs = useRef([]);
		const springsRef = useRef([]);
		const lastIndexRef = useRef(-1);
		const activeIndexRef = useRef(-1);

		useEffect(() => {
			const onProgress = ({ data }) => setProgress(data);
			Spicetify.Player.addEventListener("onprogress", onProgress);
			return () => Spicetify.Player.removeEventListener("onprogress", onProgress);
		}, []);

		const activeIndex = useMemo(() => {
			if (!lines.length) return -1;
			if (lines[0].startTime == null) return -1;
			let index = 0;
			for (let i = 0; i < lines.length; i++) {
				if (progress >= lines[i].startTime) index = i;
				else break;
			}
			return index;
		}, [lines, progress]);
		activeIndexRef.current = activeIndex;

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
		}, [lines]);

		useEffect(() => {
			let raf = 0;
			let last = performance.now();
			const tick = (now) => {
				const dt = Math.min(0.033, (now - last) / 1000);
				last = now;
				const currentIndex = activeIndexRef.current;
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
					const focusIndex = Math.max(0, currentIndex);
					const viewBox = viewport.getBoundingClientRect();
					const artBox = art?.getBoundingClientRect();
					const focusY = artBox && artBox.height
						? artBox.top + artBox.height / 2 - viewBox.top
						: viewBox.height * 0.42;
					const activeMid = prefixes[focusIndex] + heights[focusIndex] / 2;
					const layoutReady = viewBox.height > 0 && heights.every((h) => h > 1);
					const snap = lastIndexRef.current < 0;
					const indexChanged = lastIndexRef.current !== currentIndex;
					let delay = 0;
					let baseDelay = snap || !indexChanged ? 0 : 0.05;
					for (let i = 0; i < count; i++) {
						const spring = springsRef.current[i];
						const y = focusY - activeMid + prefixes[i];
						if (snap || !layoutReady) spring.snap(y);
						else spring.setTarget(y, indexChanged ? delay : 0);
						const current = spring.update(dt, now);
						const node = nodes[i];
						const blur = computeLineBlur(i, currentIndex);
						node.style.transform = `translate3d(0, ${current}px, 0) scale(${i === currentIndex ? 1 : 0.97})`;
						node.style.opacity = i === currentIndex ? "1" : "0.22";
						node.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
						if (indexChanged && !snap && y + heights[i] >= 0) {
							delay += baseDelay;
							if (i >= focusIndex) baseDelay /= 1.05;
						}
					}
					if (layoutReady) lastIndexRef.current = currentIndex;
				}
				raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
			return () => cancelAnimationFrame(raf);
		}, [lines, artRef]);

		if (!lines.length) {
			return react.createElement("div", { id: "amnp-empty-lyrics" }, "暂无歌词");
		}

		return react.createElement(
			"div",
			{ id: "amnp-lyrics-viewport", ref: viewportRef },
			react.createElement(
				"div",
				{ id: "amnp-lyrics" },
				lines.map((line, index) =>
					react.createElement(
						"div",
						{
							key: `${line.startTime}-${index}`,
							className: `amnp-line${index === activeIndex ? " active" : ""}${line.text ? "" : " empty"}`,
							ref: (el) => {
								lineRefs.current[index] = el;
							},
							onClick: () => {
								if (line.startTime != null) Spicetify.Player.seek(line.startTime);
							},
						},
						line.text || " "
					)
				)
			)
		);
	};

	const App = () => {
		const [track, setTrack] = useState(() => {
			const meta = Spicetify.Player.data?.item?.metadata || {};
			return {
				title: meta.title || "",
				artist: meta.artist_name || "",
				album: meta.album_title || "",
				cover: meta.image_xlarge_url || meta.image_large_url || "",
				heart: Spicetify.Player.getHeart(),
			};
		});
		const [lines, setLines] = useState([]);
		const [playing, setPlaying] = useState(Spicetify.Player.isPlaying());
		const artRef = useRef(null);

		const refreshTrack = () => {
			const meta = Spicetify.Player.data?.item?.metadata || {};
			setTrack({
				title: meta.title || "",
				artist: meta.artist_name || "",
				album: meta.album_title || "",
				cover: meta.image_xlarge_url || meta.image_large_url || "",
				heart: Spicetify.Player.getHeart(),
			});
		};

		useEffect(() => {
			const onSong = async () => {
				refreshTrack();
				setLines(await loadLyrics());
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
				react.createElement("div", { id: "amnp-right" }, react.createElement(Lyrics, { lines, artRef }))
			)
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
