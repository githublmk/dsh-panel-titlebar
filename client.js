window.__ModuleLoader__.load({
	id: "dsh-panel-titlebar",
	factory: (require) => {
		const STYLE_ID = "dsh-panel-titlebar/styles";
		const LEFT_VAR = "--dsh-panel-titlebar-left";

		/**
		 * Caption-row placement for the sidebar's global-panel nav.
		 *
		 * The nav stays the sidebar plugin's own registration: no component is
		 * wrapped and no row is removed. These rules only take the existing `nav`
		 * out of the sidebar flow and lay its rows out horizontally inside the
		 * Desktop caption band, immediately after the Application/Edit menubar.
		 * Everything is scoped to `html[data-windows-titlebar]`, so the plain Web
		 * GUI keeps the shipped vertical list.
		 */
		const CSS = `
html[data-windows-titlebar] nav:has(> [class*="panelRow"]) {
  position: fixed;
  top: 0;
  left: var(--dsh-panel-titlebar-left, 150px);
  box-sizing: border-box;
  height: var(--dsh-windows-titlebar-height, 40px);
  display: flex !important;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  margin: 0 !important;
  padding: 0;
  overflow: hidden;
  z-index: 1090;
  -webkit-app-region: no-drag;
  max-width: calc(100vw - var(--dsh-panel-titlebar-left, 150px) - 152px);
}
html[data-windows-titlebar] nav:has(> [class*="panelRow"]) > * {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
  margin: 0;
}
html[data-windows-titlebar] nav:has(> [class*="panelRow"]) [class*="panelRow"] {
  box-sizing: border-box;
  width: auto;
  min-width: 0;
  min-height: 28px;
  height: 28px;
  margin: 0;
  padding: 0 10px;
  gap: 6px;
  border-radius: 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 14px;
  line-height: 28px;
  flex: 0 1 auto;
  white-space: nowrap;
}
html[data-windows-titlebar] nav:has(> [class*="panelRow"]) [class*="panelRow"]:is(:hover, :focus-visible, [aria-expanded="true"]),
html[data-windows-titlebar] nav:has(> [class*="panelRow"]) [class*="panelActive"] {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
html[data-windows-titlebar] nav:has(> [class*="panelRow"]) [class*="panelTitle"] {
  max-width: 128px;
  font-size: 14px;
  line-height: 28px;
}
html[data-windows-titlebar] nav:has(> [class*="panelRow"]) [class*="panelGlyph"] {
  flex: none;
}
/* The press has already been acted on; dim the row while the panel tears down. */
html[data-windows-titlebar] nav:has(> [class*="panelRow"]) [data-dsh-pending] {
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  opacity: 0.55;
}
/*
 * 0.2.2 keeps the sticky composer on its own compositor layer with
 * will-change: transform on the seat. That declaration also makes the seat the
 * containing block for fixed descendants, which would resolve the hoisted dock
 * against the seat instead of the viewport and drop it back onto the composer.
 * It is a repaint hint, not layout, so it is withdrawn only while the dock is
 * hoisted; without the marker the shipped hint applies again.
 */
html[data-dsh-statbar] [data-composer-seat] {
  will-change: auto !important;
}
/*
 * Session stats: the composer dock (turn/step counts, speed, token total, cache
 * hit and the context meter) moves into the View tab row, right after its More
 * launcher. Gated on the marker the measurement sets, so the dock keeps its
 * shipped place whenever the header anchor cannot be found.
 */
html[data-dsh-statbar] [data-composer-dock] {
  position: fixed;
  top: var(--dsh-statbar-top, 96px);
  left: var(--dsh-statbar-left, 320px);
  right: auto;
  box-sizing: border-box;
  width: min(calc(100vw - var(--dsh-statbar-left, 320px) - 24px), max-content);
  max-width: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  transform: translateY(-50%);
  z-index: 30;
  pointer-events: auto;
}
html[data-dsh-statbar] [data-composer-dock] > * {
  flex: none;
}
/*
 * Narrow windows: the seat after the tab row's More launcher cannot hold the
 * whole readout. Flagged by the measurement, so the strip tightens and fades out
 * instead of cutting a pill in half mid-glyph.
 */
html[data-dsh-statbar="tight"] [data-composer-dock] {
  gap: 8px;
  mask-image: linear-gradient(to right, #000 calc(100% - 36px), transparent);
}
`;

		/**
		 * Align the nav with the end of the Desktop caption menubar.
		 *
		 * The menubar is a preload-injected shadow host at the frame's top-left;
		 * its right edge moves when the sidebar collapses or the locale changes,
		 * so the measured value is refreshed while the plugin is active and only
		 * written when it actually changed.
		 *
		 * @param root - the document element receiving the custom property.
		 * @returns a function that performs one measurement.
		 */
		function placer(root) {
			let previous = "";
			return () => {
				const menubar = document.querySelector("[data-windows-menu]");
				const rect = menubar === null ? null : menubar.getBoundingClientRect();
				const left = rect !== null && rect.width > 0 ? Math.round(rect.right) + 10 : 150;
				const next = `${left}px`;
				if (next === previous) return;
				previous = next;
				root.style.setProperty(LEFT_VAR, next);
			};
		}

		/**
		 * Park the session stats in the View tab row, right after its More
		 * launcher.
		 *
		 * Both the tab row and the launcher move with the session, the right
		 * column and the window width, so the anchor is re-measured with the same
		 * cadence as the caption offset. The marker is only set while the anchor
		 * exists: without it the dock keeps its shipped place below the composer.
		 * Each pass also checks that the dock actually landed on the measured
		 * seat, because the hoist is only worth its stylesheet when the fixed box
		 * still resolves against the viewport.
		 *
		 * @param root - the document element receiving the custom properties.
		 * @returns a function that performs one measurement.
		 */
		function statPlacer(root) {
			let previous = "";
			/* Consecutive passes where the dock did not land on the measured seat. */
			let missed = 0;
			/* Latched when the hoist is proven to land elsewhere: this page load
			 * keeps the shipped place instead of parking the pills on the composer. */
			let parked = false;
			return () => {
				if (parked) return;
				const anchor = document.querySelector('button[class*="viewsMore"]')
					?? document.querySelector('[class*="viewTabs"]');
				const rect = anchor === null ? null : anchor.getBoundingClientRect();
				if (rect === null || (rect.width === 0 && rect.height === 0)) {
					if (root.hasAttribute("data-dsh-statbar")) root.removeAttribute("data-dsh-statbar");
					previous = "";
					return;
				}
				const top = Math.round(rect.top + rect.height / 2);
				const left = Math.round(rect.right + 18);
				const next = `${top},${left}`;
				if (next !== previous) {
					previous = next;
					root.style.setProperty("--dsh-statbar-top", `${top}px`);
					root.style.setProperty("--dsh-statbar-left", `${left}px`);
				}
				const dock = document.querySelector("[data-composer-dock]");
				if (dock === null) {
					if (root.hasAttribute("data-dsh-statbar")) root.removeAttribute("data-dsh-statbar");
					return;
				}
				const width = dock.scrollWidth;
				const room = window.innerWidth - 24 - left;
				const state = width > room ? "tight" : "";
				if (root.getAttribute("data-dsh-statbar") !== state) root.setAttribute("data-dsh-statbar", state);
				/* A build that makes an ancestor the containing block for fixed
				 * descendants (a transform or `will-change` on the composer seat)
				 * resolves the dock against that ancestor instead of the viewport.
				 * Compare the landed box with the measured seat; two misses in a
				 * row mean the shipped place below the composer is the honest one. */
				const placed = dock.getBoundingClientRect();
				const off = placed.width === 0
					|| Math.abs(placed.left - left) > 8
					|| Math.abs(placed.top + placed.height / 2 - top) > 8;
				missed = off ? missed + 1 : 0;
				if (missed < 2) return;
				parked = true;
				root.removeAttribute("data-dsh-statbar");
			};
		}

		/**
		 * Make the caption entries behave like a toggle: a second click on the
		 * already selected entry returns to the conversation.
		 *
		 * The shipped row keeps its own click handler and its own aria-current
		 * marker; this listener only fires for the one row that reports
		 * `aria-current="page"` and stops that click before the shipped handler
		 * re-selects the same panel. The More launcher (`aria-haspopup`) is never
		 * a panel entry, so it keeps opening its menu.
		 *
		 * @param ctx - client root context carrying the layout service.
		 * @returns a cleanup function removing the listener.
		 */
		function installToggle(ctx) {
			const layout = ctx.get("layout");
			if (layout === void 0 || typeof layout.selectPanel !== "function") return () => {};

			/** The row already cancelled on pointerdown; its click must not re-select. */
			let swallowed = null;
			let swallowTimer = 0;
			let pendingTimer = 0;
			let pendingRow = null;

			const activeRow = (target) => {
				if (!document.documentElement.hasAttribute("data-windows-titlebar")) return null;
				if (!(target instanceof Element)) return null;
				const row = target.closest('[class*="panelRow"]');
				if (row === null || row.getAttribute("aria-current") !== "page") return null;
				if (row.getAttribute("aria-haspopup") !== null) return null;
				const nav = row.closest("nav");
				if (nav === null || nav.querySelector(':scope > [class*="panelRow"]') === null) return null;
				return row;
			};

			/**
			 * Deselect immediately: dim the row so the press has visible feedback,
			 * then hand the switch to the layout service. The panel's own teardown
			 * and the conversation's mount are the only remaining cost.
			 */
			const cancel = (row) => {
				window.clearTimeout(pendingTimer);
				window.clearTimeout(swallowTimer);
				if (pendingRow !== null) pendingRow.removeAttribute("data-dsh-pending");
				pendingRow = row;
				row.setAttribute("data-dsh-pending", "");
				swallowed = row;
				swallowTimer = window.setTimeout(() => {
					swallowed = null;
					if (pendingRow !== null) pendingRow.removeAttribute("data-dsh-pending");
					pendingRow = null;
				}, 900);
				layout.selectPanel(null);
			};

			/* Pointer input cancels on the press, not on the release, so the switch
			 * starts up to a full click delay earlier. */
			const onPointerDown = (event) => {
				if (event.button !== 0) return;
				const row = activeRow(event.target);
				if (row !== null) cancel(row);
			};

			const onClick = (event) => {
				const target = event.target;
				const row = target instanceof Element ? target.closest('[class*="panelRow"]') : null;
				if (row !== null && row === swallowed) {
					event.preventDefault();
					event.stopPropagation();
					swallowed = null;
					return;
				}
				/* Keyboard activation has no pointerdown, so the click path stays. */
				const active = activeRow(target);
				if (active === null) return;
				event.preventDefault();
				event.stopPropagation();
				cancel(active);
			};

			document.addEventListener("pointerdown", onPointerDown, true);
			document.addEventListener("click", onClick, true);
			return () => {
				document.removeEventListener("pointerdown", onPointerDown, true);
				document.removeEventListener("click", onClick, true);
				window.clearTimeout(swallowTimer);
				window.clearTimeout(pendingTimer);
				if (pendingRow !== null) pendingRow.removeAttribute("data-dsh-pending");
			};
		}

		return {
			inject: ["layout"],
			/**
			 * Install the caption-row styles, keep the menubar offset current and
			 * turn the shipped entries into toggles.
			 * @param ctx - client root context.
			 */
			apply(ctx) {
				if (typeof document === "undefined" || typeof window === "undefined") return;

				if (ctx !== void 0 && typeof ctx.effect === "function") {
					ctx.effect(() => {
						if (document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_ID)}]`) !== null) return () => {};
						const tag = document.createElement("style");
						tag.dataset.plugin = "dsh-panel-titlebar";
						tag.dataset.pluginCss = STYLE_ID;
						tag.textContent = CSS;
						document.head.appendChild(tag);
						return () => tag.remove();
					}, "panel-titlebar: styles");

					ctx.effect(() => {
						const root = document.documentElement;
						const measure = placer(root);
						const measureStats = statPlacer(root);
						const run = () => {
							measure();
							measureStats();
						};
						run();

						let frame = 0;
						const schedule = () => {
							if (frame !== 0) return;
							frame = window.requestAnimationFrame(() => {
								frame = 0;
								run();
							});
						};

						/* Position and size of both anchors can change without a resize event.
						 * Every read below forces a style/layout flush, so the periodic pass
						 * runs only when the page is idle: a flush that lands in the middle of
						 * a view mount costs the whole tree, which is exactly when the user is
						 * waiting for a switch to finish. */
						let idle = 0;
						const idleRun = () => {
							idle = 0;
							if (document.visibilityState !== "hidden") run();
						};
						const timer = window.setInterval(() => {
							if (idle !== 0) return;
							idle = typeof window.requestIdleCallback === "function"
								? window.requestIdleCallback(idleRun, { timeout: 2000 })
								: window.setTimeout(idleRun, 200);
						}, 1000);
						window.addEventListener("resize", schedule);
						const resize = typeof ResizeObserver === "function"
							? new ResizeObserver(schedule)
							: null;
						if (resize !== null) {
							const menubar = document.querySelector("[data-windows-menu]");
							if (menubar !== null) resize.observe(menubar);
						}
						const watch = typeof MutationObserver === "function"
							? new MutationObserver((records) => {
								for (const record of records) {
									for (const node of record.addedNodes) {
										if (node instanceof Element && node.matches("[data-windows-menu]")) {
											if (resize !== null) resize.observe(node);
											schedule();
											return;
										}
									}
								}
							})
							: null;
						if (watch !== null) watch.observe(document.body, { childList: true });

						return () => {
							window.clearInterval(timer);
							if (idle !== 0) {
								if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
								else window.clearTimeout(idle);
							}
							if (frame !== 0) window.cancelAnimationFrame(frame);
							window.removeEventListener("resize", schedule);
							resize?.disconnect();
							watch?.disconnect();
							root.removeAttribute("data-dsh-statbar");
						};
					}, "panel-titlebar: chrome alignment");

					ctx.effect(() => installToggle(ctx), "panel-titlebar: entry toggle");
				}
			},
		};
	},
});
