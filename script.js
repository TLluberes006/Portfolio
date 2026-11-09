document.getElementById("email-alert")?.addEventListener("click", () => {
  window.alert("Email: tuckerlluberes006@gmail.com");
});

const browserAgent = navigator.userAgent;
if (/Safari/i.test(browserAgent) && !/(Chrome|Chromium|CriOS|Edg)/i.test(browserAgent)) {
  document.documentElement.classList.add("is-safari");
}

// Split the inline SVG into individual hover targets so every glyph responds.
const asciiSvg = document.getElementById("ascii-art");
const asciiRows = [...(asciiSvg?.querySelectorAll("text > tspan") ?? [])];
const asciiChoices = [...new Set(asciiRows.flatMap((row) => [...row.textContent]).filter((glyph) => !/\s/.test(glyph)))];
const asciiGlyphTimers = new WeakMap();

function animateAsciiGlyph(glyph, nextCharacter, delay = 110) {
  const previous = asciiGlyphTimers.get(glyph);
  if (previous) window.clearTimeout(previous);
  if (delay === 0) {
    glyph.textContent = nextCharacter;
    asciiGlyphTimers.delete(glyph);
    return;
  }

  const timeout = window.setTimeout(() => {
    glyph.textContent = nextCharacter;
    asciiGlyphTimers.delete(glyph);
  }, delay);
  asciiGlyphTimers.set(glyph, timeout);
}

asciiRows.forEach((row) => {
  const characters = [...row.textContent];
  row.replaceChildren();
  characters.forEach((character) => {
    const glyph = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    glyph.setAttribute("xml:space", "preserve");
    glyph.textContent = character;
    if (!/\s/.test(character)) {
      glyph.dataset.original = character;
      glyph.setAttribute("pointer-events", "all");
      glyph.addEventListener("pointerenter", () => {
        const alternatives = asciiChoices.filter((candidate) => candidate !== glyph.dataset.original);
        animateAsciiGlyph(glyph, alternatives[Math.floor(Math.random() * alternatives.length)], 0);
      });
      glyph.addEventListener("pointerleave", () => {
        animateAsciiGlyph(glyph, glyph.dataset.original);
      });
    }
    row.append(glyph);
  });
});

const panels = [...document.querySelectorAll(".panel-window")];
let windowOrder = 10;
const lastOpener = new Map();

function closePanel(panel) {
  if (panel.hidden) return;
  panel.setAttribute("aria-hidden", "true");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    panel.hidden = true;
    panel.classList.remove("is-closing");
    return;
  }
  panel.classList.add("is-closing");
  window.setTimeout(() => {
    if (!panel.classList.contains("is-closing")) return;
    panel.hidden = true;
    panel.classList.remove("is-closing");
  }, 260);
}

document.querySelector("[data-view=\"home\"]")?.addEventListener("click", () => {
  panels.forEach(closePanel);
});

function raisePanel(panel) {
  panel.style.zIndex = String(++windowOrder);
}

function showIntroPanel() {
  const introPanel = document.getElementById("intro");
  if (!introPanel) return;
  introPanel.hidden = false;
  introPanel.setAttribute("aria-hidden", "false");
  raisePanel(introPanel);
}

const openingFade = document.getElementById("opening-fade");
const openingFadeDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    openingFade?.classList.add("is-hidden");
    window.setTimeout(() => {
      openingFade?.remove();
      window.setTimeout(showIntroPanel, 500);
    }, openingFadeDuration);
  });
});

document.querySelectorAll("[data-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.dialog);
    if (!panel) return;
    panel.classList.remove("is-closing");
    lastOpener.set(panel, button);
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    raisePanel(panel);
  });
});

panels.forEach((panel) => {
  const closeButton = panel.querySelector(".close");
  closeButton?.addEventListener("click", () => {
    closePanel(panel);
    lastOpener.get(panel)?.focus();
  });
  const resizeHandle = panel.querySelector("[data-resize-handle]");
  resizeHandle?.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    resizeHandle.setPointerCapture(event.pointerId);
    raisePanel(panel);
    const rect = panel.getBoundingClientRect();
    const startY = event.clientY;
    const startHeight = rect.height;
    const minHeight = 210;
    const maxHeight = Math.max(minHeight, window.innerHeight - rect.top - 12);
    panel.style.top = rect.top + "px";
    panel.style.bottom = "auto";
    panel.style.height = startHeight + "px";
    const move = (moveEvent) => {
      const height = Math.max(minHeight, Math.min(maxHeight, startHeight + moveEvent.clientY - startY));
      panel.style.height = height + "px";
    };
    const stop = () => {
      resizeHandle.removeEventListener("pointermove", move);
      resizeHandle.removeEventListener("pointerup", stop);
      resizeHandle.removeEventListener("pointercancel", stop);
    };
    resizeHandle.addEventListener("pointermove", move);
    resizeHandle.addEventListener("pointerup", stop);
    resizeHandle.addEventListener("pointercancel", stop);
  });

  panel.addEventListener("pointerdown", () => raisePanel(panel));

  const handle = panel.querySelector("[data-drag-handle]");
  handle?.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    raisePanel(panel);
    const rect = panel.getBoundingClientRect();
    const originX = event.clientX;
    const originY = event.clientY;
    const left = rect.left;
    const top = rect.top;
    const move = (moveEvent) => {
      const nextLeft = Math.max(0, Math.min(window.innerWidth - 100, left + moveEvent.clientX - originX));
      const nextTop = Math.max(0, Math.min(window.innerHeight - 44, top + moveEvent.clientY - originY));
      panel.style.left = nextLeft + "px";
      panel.style.top = nextTop + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    };
    const stop = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const topPanel = panels.filter((panel) => !panel.hidden).sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0))[0];
  if (topPanel) {
    closePanel(topPanel);
    lastOpener.get(topPanel)?.focus();
  }
});

