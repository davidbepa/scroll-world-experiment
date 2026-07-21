const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[char]));

export function renderPosterHTML(cases) {
  return `<div class="poster-world">
    <section class="poster-hero" aria-labelledby="poster-hero-title">
      <p class="eyebrow">Connected experiences · measurable growth</p>
      <h1 id="poster-hero-title">Experience is your growth system.</h1>
      <p>We connect strategy, design, technology, data, AI and marketing to create digital experiences that perform.</p>
    </section>
    ${cases.map((scene, index) => `<article class="poster-case" id="${escapeHTML(scene.id)}">
      <img src="${escapeHTML(scene.still.replace(/^public\//, ''))}" onerror="this.src='assets/fallback-system.svg'" alt="" />
      <div><span>${String(index + 1).padStart(2, '0')} / ${String(cases.length).padStart(2, '0')}</span>
      <p class="eyebrow">${escapeHTML(scene.eyebrow)}</p><h2>${escapeHTML(scene.title)}</h2>
      <p>${escapeHTML(scene.body)}</p><strong>${escapeHTML(scene.proof)}</strong>
      <ul>${scene.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>
      <a href="${escapeHTML(scene.source)}">Read the ${escapeHTML(scene.label)} story</a>
      ${scene.cta ? `<a class="primary-cta" href="${escapeHTML(scene.cta.primary.href)}">${escapeHTML(scene.cta.primary.label)}</a>` : ''}</div>
    </article>`).join('')}
  </div>`;
}

export function mountPosterWorld(container, cases) {
  container.dataset.mode = 'posters';
  container.innerHTML = renderPosterHTML(cases);
}
