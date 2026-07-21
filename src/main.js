import { CASES, createWorldConfig } from './cases.js';
import { mountPosterWorld } from './poster-world.js';
import { mountScrollWorld } from './scroll-world.js';

export function getExperienceMode({ reduced, coarse, small }) {
  return reduced || coarse || small ? 'posters' : 'film';
}

function runtimeMedia() {
  return {
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarse: matchMedia('(hover: none) and (pointer: coarse)').matches,
    small: matchMedia('(max-width: 860px)').matches,
  };
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('world');
  if (getExperienceMode(runtimeMedia()) === 'posters') mountPosterWorld(root, CASES);
  else {
    const config = createWorldConfig();
    if (location.hostname === 'localhost') {
      const params = new URLSearchParams(location.search);
      const missingConnector = Number(params.get('qaMissingConnector'));
      const missingVideo = Number(params.get('qaMissingVideo'));
      if (missingConnector >= 1 && missingConnector <= config.connectors.length) config.connectors[missingConnector - 1] = null;
      if (missingVideo >= 1 && missingVideo <= config.sections.length) config.sections[missingVideo - 1].clip = 'assets/video/intentionally-missing.mp4';
    }
    const controller = mountScrollWorld(root, config);
    if (location.hostname === 'localhost') window.__scrollWorld = controller;
  }
}
