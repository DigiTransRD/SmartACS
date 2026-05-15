(function () {
  "use strict";

  const loginView = document.getElementById("loginView");
  const siteView = document.getElementById("siteView");
  const loginForm = document.getElementById("loginForm");
  const passwordInput = document.getElementById("passwordInput");
  const loginMessage = document.getElementById("loginMessage");
  const lockButton = document.getElementById("lockButton");
  const contentRoot = document.getElementById("contentRoot");
  const sectionNav = document.getElementById("sectionNav");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function deriveContentKey(password, salt, iterations) {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  }

  async function decryptPayload(password) {
    const response = await fetch("content.enc.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("encrypted-content-not-found");
    }
    const encrypted = await response.json();
    const salt = base64ToBytes(encrypted.salt);
    const iv = base64ToBytes(encrypted.iv);
    const ciphertext = base64ToBytes(encrypted.ciphertext);
    const key = await deriveContentKey(password, salt, encrypted.iterations);
    const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    const plainText = new TextDecoder().decode(plainBuffer);
    return JSON.parse(plainText);
  }

  function listItems(items) {
    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function renderHero(data) {
    return `
      <section id="top" class="hero">
        <div>
          <p class="eyebrow">${escapeHtml(data.kicker)}</p>
          <h1>${escapeHtml(data.title)}</h1>
          <p class="hero-lead">${escapeHtml(data.lead)}</p>
          <div class="hero-meta">
            ${data.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="metric-row">
            ${data.metrics.map((metric) => `
              <div class="metric">
                <b>${escapeHtml(metric.value)}</b>
                <span>${escapeHtml(metric.label)}</span>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="hero-visual" aria-label="產品能力概念圖">
          <div class="control-tower">
            <div class="tower-grid">
              ${data.visualCells.map((cell) => `
                <div class="tower-cell">
                  <strong>${escapeHtml(cell.title)}</strong>
                  <span>${escapeHtml(cell.text)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderSectionHeader(section) {
    return `
      <div class="section-header">
        <div>
          <p class="section-kicker">${escapeHtml(section.kicker)}</p>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
        <p class="section-intro">${escapeHtml(section.intro)}</p>
      </div>
    `;
  }

  function renderCards(cards, columns) {
    return `
      <div class="grid ${columns}">
        ${cards.map((card) => `
          <article class="card">
            <h3>${escapeHtml(card.title)}</h3>
            ${card.text ? `<p>${escapeHtml(card.text)}</p>` : ""}
            ${card.items ? listItems(card.items) : ""}
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderArchitecture(section) {
    return `
      <section id="${escapeHtml(section.id)}" class="section">
        ${renderSectionHeader(section)}
        <div class="architecture">
          <div class="arch-lanes">
            ${section.lanes.map((lane, laneIndex) => `
              <div class="arch-lane">
                <h3>${escapeHtml(lane.title)}</h3>
                ${lane.nodes.map((node, nodeIndex) => {
                  const nodeClass = nodeIndex === 0 && laneIndex === 1 ? " primary" : node.accent ? " accent" : "";
                  return `
                    <div class="arch-node${nodeClass}">
                      <strong>${escapeHtml(node.title)}</strong>
                      <span>${escapeHtml(node.text)}</span>
                    </div>
                  `;
                }).join("")}
              </div>
            `).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderPhases(section) {
    return `
      <section id="${escapeHtml(section.id)}" class="section">
        ${renderSectionHeader(section)}
        <div class="phase-board">
          ${section.phases.map((phase, index) => `
            <article class="phase" data-phase="0${index + 1}">
              <span class="tag">${escapeHtml(phase.tag)}</span>
              <h3>${escapeHtml(phase.title)}</h3>
              <p>${escapeHtml(phase.text)}</p>
              ${listItems(phase.items)}
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderMatrix(section) {
    return `
      <section id="${escapeHtml(section.id)}" class="section">
        ${renderSectionHeader(section)}
        <div class="feature-matrix" role="table" aria-label="三階段功能矩陣">
          <div class="matrix-row header" role="row">
            <div role="columnheader">功能模組</div>
            <div role="columnheader">第一階段</div>
            <div role="columnheader">第二階段</div>
            <div role="columnheader">第三階段</div>
          </div>
          ${section.rows.map((row) => `
            <div class="matrix-row" role="row">
              <div role="cell"><strong>${escapeHtml(row.module)}</strong><br><span>${escapeHtml(row.detail)}</span></div>
              ${row.phases.map((phase) => `<div role="cell">${phase ? `<span class="mark${phase === "later" ? " later" : ""}">${phase === "later" ? "＋" : "✓"}</span>` : ""}</div>`).join("")}
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderAi(section) {
    return `
      <section id="${escapeHtml(section.id)}" class="section">
        ${renderSectionHeader(section)}
        <div class="ai-panel">
          <div class="ai-loop">
            ${section.loop.map((step) => `
              <div class="ai-step">
                <strong>${escapeHtml(step.title)}</strong>
                <span>${escapeHtml(step.text)}</span>
              </div>
            `).join("")}
          </div>
          ${renderCards(section.cards, "two")}
        </div>
      </section>
    `;
  }

  function renderApi(section) {
    return `
      <section id="${escapeHtml(section.id)}" class="section">
        ${renderSectionHeader(section)}
        <article class="card">
          <h3>${escapeHtml(section.cardTitle)}</h3>
          <p>${escapeHtml(section.cardText)}</p>
          <ul class="api-list">
            ${section.routes.map((route) => `<li><code>${escapeHtml(route)}</code></li>`).join("")}
          </ul>
        </article>
      </section>
    `;
  }

  function renderGeneric(section) {
    return `
      <section id="${escapeHtml(section.id)}" class="section">
        ${renderSectionHeader(section)}
        ${renderCards(section.cards, section.columns || "three")}
      </section>
    `;
  }

  function renderFooter(data) {
    return `
      <footer class="footer">
        <strong>${escapeHtml(data.title)}</strong>
        <p>${escapeHtml(data.text)}</p>
      </footer>
    `;
  }

  function renderSite(data) {
    const renderers = {
      architecture: renderArchitecture,
      phases: renderPhases,
      matrix: renderMatrix,
      ai: renderAi,
      api: renderApi,
      generic: renderGeneric
    };

    sectionNav.innerHTML = data.navigation.map((item) => (
      `<a href="#${escapeHtml(item.id)}" data-nav-link>${escapeHtml(item.label)}</a>`
    )).join("");

    contentRoot.innerHTML = [
      renderHero(data.hero),
      ...data.sections.map((section) => renderers[section.type](section)),
      renderFooter(data.footer)
    ].join("");

    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || !href.startsWith("#")) {
          return;
        }
        const target = document.querySelector(href);
        if (!target) {
          return;
        }
        event.preventDefault();
        window.scrollTo({ top: Math.max(target.offsetTop - 12, 0), behavior: "smooth" });
      });
    });

    loginView.classList.add("is-hidden");
    siteView.classList.remove("is-hidden");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "解密中...";
    const submitButton = loginForm.querySelector("button");
    submitButton.disabled = true;
    try {
      const data = await decryptPayload(passwordInput.value);
      passwordInput.value = "";
      loginMessage.textContent = "";
      renderSite(data);
    } catch (error) {
      loginMessage.textContent = "密碼錯誤，或加密內容無法讀取。";
      passwordInput.select();
    } finally {
      submitButton.disabled = false;
    }
  });

  lockButton.addEventListener("click", () => {
    contentRoot.innerHTML = "";
    sectionNav.innerHTML = "";
    siteView.classList.add("is-hidden");
    loginView.classList.remove("is-hidden");
    loginMessage.textContent = "";
    passwordInput.focus();
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}());
