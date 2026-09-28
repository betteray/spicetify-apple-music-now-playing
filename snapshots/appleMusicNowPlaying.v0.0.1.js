// NAME: Apple Music Now Playing
// AUTHOR: ray
// VERSION: 0.0.1
// DESCRIPTION: Apple Music-style fullscreen cover + synced lyrics. Snapshot kept as v0.0.1.

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
	inset: -18%;
	z-index: 0;
	overflow: hidden;
	pointer-events: none;
	filter: blur(78px) saturate(1.95) brightness(0.5);
}
.amnp-blob {
	position: absolute;
	top: 50%;
	left: 50%;
	background-size: cover;
	background-position: center;
	border-radius: 22%;
	will-change: transform;
}
.amnp-blob-1 { animation: amnp-orbit-a 22s linear infinite; }
.amnp-blob-2 { animation: amnp-orbit-b 34s linear infinite reverse; }
.amnp-blob-3 { animation: amnp-spin 48s linear infinite; }
.amnp-blob-4 { animation: amnp-spin 62s linear infinite reverse; }
@keyframes amnp-orbit-a {
	from { transform: translate(-50%, -50%) rotate(0deg) translateX(18vw) rotate(0deg); }
	to { transform: translate(-50%, -50%) rotate(360deg) translateX(18vw) rotate(-360deg); }
}
@keyframes amnp-orbit-b {
	from { transform: translate(-50%, -50%) rotate(0deg) translateX(12vw) rotate(0deg); }
	to { transform: translate(-50%, -50%) rotate(360deg) translateX(12vw) rotate(-360deg); }
}
@keyframes amnp-spin {
	from { transform: translate(-50%, -50%) rotate(0deg); }
	to { transform: translate(-50%, -50%) rotate(360deg); }
}
#amnp-bg-dim {
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.16);
	z-index: 1;
}
#amnp-layout {
	position: relative;
	z-index: 2;
	height: 100%;
	display: grid;
	grid-template-columns: minmax(420px, 42vw) 1fr;
	align-items: center;
}
#amnp-left {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	padding: 6vh 3vw 6vh 8vw;
	min-width: 0;
}
#amnp-art {
	width: min(52vh, 520px);
	aspect-ratio: 1;
	border-radius: 8px;
	background-size: cover;
	background-position: center;
	box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
}
#amnp-meta {
	width: min(52vh, 520px);
	margin-top: 20px;
}
#amnp-meta-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
}
#amnp-title {
	font-size: 15px;
	font-weight: 400;
	letter-spacing: 0;
	line-height: 1.25;
	color: #fff;
}
#amnp-artist {
	margin-top: 2px;
	font-size: 12px;
	font-weight: 400;
	color: rgba(255, 255, 255, 0.52);
	line-height: 1.3;
}
#amnp-heart {
	background: none;
	border: 0;
	padding: 0;
	color: rgba(255, 255, 255, 0.72);
	cursor: pointer;
	flex-shrink: 0;
	margin-top: 1px;
}
#amnp-progress-wrap {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 16px;
	width: 100%;
}
#amnp-time {
	font-size: 11px;
	font-variant-numeric: tabular-nums;
	color: rgba(255, 255, 255, 0.46);
	min-width: 36px;
}
#amnp-time.end { text-align: right; }
#amnp-bar {
	flex: 1;
	height: 3px;
	border-radius: 3px;
	background: rgba(255, 255, 255, 0.26);
	position: relative;
	cursor: pointer;
}
#amnp-bar-inner {
	height: 100%;
	border-radius: 3px;
	background: #fff;
	position: relative;
}
#amnp-thumb {
	position: absolute;
	top: 50%;
	right: 0;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #fff;
	transform: translate(50%, -50%);
}
#amnp-controls {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 34px;
	width: 100%;
	margin-top: 14px;
}
#amnp-controls button {
	background: none;
	border: 0;
	padding: 0;
	color: #fff;
	cursor: pointer;
	opacity: 0.92;
}
#amnp-controls button.play { opacity: 1; }
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
	padding: 0 7vw 0 1.2vw;
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
	padding-left: 2vw;
}
`;

	function createSpring(mass = 0.9, damping = 15, stiffness = 90) {
		let pos = 0;
		let vel = 0;
		let target = 0;
		return {
			setTarget(next) {
				target = next;
			},
			snap(next) {
				pos = next;
				vel = 0;
				target = next;
			},
			update(dt) {
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

	const Icon = ({ icon, size }) =>
		react.createElement("svg", {
			width: size,
			height: size,
			viewBox: "0 0 16 16",
			fill: "currentColor",
			dangerouslySetInnerHTML: { __html: icon },
		});

	const Progress = () => {
		const [progress, setProgress] = useState(Spicetify.Player.getProgress());
		const duration = Spicetify.Platform.PlayerAPI._state.duration || 1;
		const barRef = useRef(null);
		const dragging = useRef(false);

		useEffect(() => {
			const onProgress = ({ data }) => {
				if (!dragging.current) setProgress(data);
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
			react.createElement("span", { id: "amnp-time" }, formatTime(progress)),
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
					{ id: "amnp-bar-inner", style: { width: `${(progress / duration) * 100}%` } },
					react.createElement("div", { id: "amnp-thumb" })
				)
			),
			react.createElement("span", { id: "amnp-time", className: "end" }, `-${formatTime(Math.max(0, duration - progress))}`)
		);
	};

	const Controls = () => {
		const [playing, setPlaying] = useState(Spicetify.Player.isPlaying());
		useEffect(() => {
			const update = ({ data }) => setPlaying(!data.isPaused);
			Spicetify.Player.addEventListener("onplaypause", update);
			return () => Spicetify.Player.removeEventListener("onplaypause", update);
		}, []);
		return react.createElement(
			"div",
			{ id: "amnp-controls" },
			react.createElement("button", { onClick: Spicetify.Player.back }, react.createElement(Icon, { icon: Spicetify.SVGIcons["skip-back"], size: 22 })),
			react.createElement(
				"button",
				{ className: "play", onClick: Spicetify.Player.togglePlay },
				react.createElement(Icon, { icon: Spicetify.SVGIcons[playing ? "pause" : "play"], size: 30 })
			),
			react.createElement("button", { onClick: Spicetify.Player.next }, react.createElement(Icon, { icon: Spicetify.SVGIcons["skip-forward"], size: 22 }))
		);
	};

	const Lyrics = ({ lines, artRef }) => {
		const [progress, setProgress] = useState(Spicetify.Player.getProgress());
		const viewportRef = useRef(null);
		const lineRefs = useRef([]);
		const springsRef = useRef([]);
		const lastIndexRef = useRef(-1);

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

		useEffect(() => {
			springsRef.current = lines.map((_, i) => springsRef.current[i] || createSpring(0.9, 15, 90));
			lastIndexRef.current = -1;
		}, [lines]);

		useEffect(() => {
			let raf = 0;
			let last = performance.now();
			const tick = (now) => {
				const dt = Math.min(0.033, (now - last) / 1000);
				last = now;
				const viewport = viewportRef.current;
				const art = artRef?.current;
				const nodes = lineRefs.current;
				if (viewport && nodes.length === lines.length) {
					const heights = nodes.map((node) => node?.offsetHeight || 72);
					const prefixes = [0];
					for (let i = 0; i < heights.length; i++) prefixes.push(prefixes[i] + heights[i]);
					const focusIndex = Math.max(0, activeIndex);
					const viewBox = viewport.getBoundingClientRect();
					const artBox = art?.getBoundingClientRect();
					const focusY = artBox ? artBox.top + artBox.height / 2 - viewBox.top : viewBox.height * 0.42;
					const activeMid = prefixes[focusIndex] + heights[focusIndex] / 2;
					const snap = lastIndexRef.current < 0;
					lastIndexRef.current = activeIndex;
					for (let i = 0; i < lines.length; i++) {
						const spring = springsRef.current[i];
						const y = focusY - activeMid + prefixes[i];
						if (snap) spring.snap(y);
						else spring.setTarget(y);
						const current = spring.update(dt);
						const node = nodes[i];
						if (node) {
							const blur = computeLineBlur(i, activeIndex);
							node.style.transform = `translate3d(0, ${current}px, 0) scale(${i === activeIndex ? 1 : 0.97})`;
							node.style.opacity = i === activeIndex ? "1" : "0.22";
							node.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
						}
					}
				}
				raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
			return () => cancelAnimationFrame(raf);
		}, [lines, activeIndex, artRef]);

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
			onSong();
			Spicetify.Player.addEventListener("songchange", onSong);
			return () => Spicetify.Player.removeEventListener("songchange", onSong);
		}, []);

		const cover = track.cover ? `url("${track.cover}")` : "none";

		return react.createElement(
			"div",
			{
				id: "amnp-root",
				onDoubleClick: deactivate,
			},
			react.createElement(
				"div",
				{ id: "amnp-bg" },
				[0.25, 0.5, 0.8, 1.25].map((scale, index) =>
					react.createElement("div", {
						key: index,
						className: `amnp-blob amnp-blob-${index + 1}`,
						style: {
							backgroundImage: cover,
							width: `${scale * 100}vw`,
							height: `${scale * 100}vw`,
						},
					})
				)
			),
			react.createElement("div", { id: "amnp-bg-dim" }),
			react.createElement(
				"div",
				{ id: "amnp-layout" },
				react.createElement(
					"div",
					{ id: "amnp-left" },
					react.createElement("div", { id: "amnp-art", ref: artRef, style: { backgroundImage: cover } }),
					react.createElement(
						"div",
						{ id: "amnp-meta" },
						react.createElement(
							"div",
							{ id: "amnp-meta-row" },
							react.createElement(
								"div",
								null,
								react.createElement("div", { id: "amnp-title" }, track.title),
								react.createElement("div", { id: "amnp-artist" }, track.album ? `${track.artist} — ${track.album}` : track.artist)
							),
							react.createElement(
								"button",
								{
									id: "amnp-heart",
									onClick: (event) => {
										event.stopPropagation();
										Spicetify.Player.toggleHeart();
										setTrack((current) => ({ ...current, heart: !current.heart }));
									},
								},
								react.createElement(Icon, {
									icon: Spicetify.SVGIcons[track.heart ? "heart-active" : "heart"],
									size: 16,
								})
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

	new Spicetify.Topbar.Button(
		"Apple Music Display",
		`<svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.projector}</svg>`,
		activate
	);
	Spicetify.Mousetrap.bind("f11", toggle);
})();
