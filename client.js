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
  width: max-content;
  max-width: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
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
		 *
		 * @param root - the document element receiving the custom properties.
		 * @returns a function that performs one measurement.
		 */
		function statPlacer(root) {
			let previous = "";
			return () => {
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
				const width = dock === null ? 0 : Math.ceil(dock.getBoundingClientRect().width);
				const room = window.innerWidth - 24 - left;
				const state = width > 0 && width > room ? "tight" : "";
				if (root.getAttribute("data-dsh-statbar") !== state) root.setAttribute("data-dsh-statbar", state);
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

			const onPointerClick = (event) => {
				if (!document.documentElement.hasAttribute("data-windows-titlebar")) return;
				const target = event.target;
				if (!(target instanceof Element)) return;
				const row = target.closest('[class*="panelRow"]');
				if (row === null || row.getAttribute("aria-current") !== "page") return;
				if (row.getAttribute("aria-haspopup") !== null) return;
				const nav = row.closest("nav");
				if (nav === null || nav.querySelector(':scope > [class*="panelRow"]') === null) return;
				event.preventDefault();
				event.stopPropagation();
				layout.selectPanel(null);
			};

			document.addEventListener("click", onPointerClick, true);
			return () => document.removeEventListener("click", onPointerClick, true);
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

						/* Position and size of both anchors can change without a resize event. */
						const timer = window.setInterval(run, 500);
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
