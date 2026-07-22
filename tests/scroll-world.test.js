import test from 'node:test';
import assert from 'node:assert/strict';
import { mountScrollWorld } from '../src/scroll-world.js';

class FakeClassList {
  constructor(element) {
    this.element = element;
    this.values = new Set();
  }

  set(value) {
    this.values = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  add(...values) {
    values.forEach(value => this.values.add(value));
  }

  remove(...values) {
    values.forEach(value => this.values.delete(value));
  }

  contains(value) {
    return this.values.has(value);
  }

  toggle(value, force) {
    const active = force === undefined ? !this.contains(value) : force;
    if (active) this.add(value);
    else this.remove(value);
    return active;
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.classList = new FakeClassList(this);
    this.style = { setProperty(name, value) { this[name] = value; } };
    this.dataset = {};
    this.attributes = new Map();
    this.id = '';
    this.textContent = '';
    this.innerHTML = '';
    this.listeners = new Map();
  }

  set className(value) {
    this.classList.set(value);
  }

  get className() {
    return [...this.classList.values].join(' ');
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  append(...children) {
    children.forEach(child => this.appendChild(child));
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }

  dispatch(type, event = {}) {
    for (const handler of this.listeners.get(type) || []) handler(event);
  }

  pause() {}

  play() {
    return Promise.resolve();
  }

  querySelectorAll(selector) {
    const className = selector.startsWith('.') ? selector.slice(1) : null;
    const matches = [];
    const visit = node => {
      if (className && node.classList.contains(className)) matches.push(node);
      node.children.forEach(visit);
    };
    this.children.forEach(visit);
    return matches;
  }
}

function createBrowserFixture({ reduceMotion = true, fetchImpl } = {}) {
  const documentElement = new FakeElement('html');
  const head = new FakeElement('head');
  const body = new FakeElement('body');
  const document = {
    documentElement,
    head,
    body,
    createElement: tagName => new FakeElement(tagName),
    getElementById(id) {
      let match = null;
      const visit = node => {
        if (node.id === id) match = node;
        node.children.forEach(visit);
      };
      visit(head);
      visit(body);
      return match;
    },
  };
  const listeners = new Map();
  const window = {
    innerHeight: 900,
    innerWidth: 1440,
    scrollY: 0,
    pageYOffset: 0,
    matchMedia: query => ({ matches: reduceMotion && query.includes('prefers-reduced-motion') }),
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || new Set();
      handlers.add(handler);
      listeners.set(type, handlers);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    scrollTo() {},
  };
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    fetch: globalThis.fetch,
    URL: globalThis.URL,
  };
  globalThis.window = window;
  globalThis.document = document;
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.fetch = fetchImpl ?? previous.fetch;
  globalThis.URL = {
    createObjectURL: blob => `blob:${blob.url ?? 'test'}`,
    revokeObjectURL() {},
  };

  return {
    document,
    createRoot() {
      const root = new FakeElement('main');
      body.appendChild(root);
      return root;
    },
    setScroll(value) {
      window.scrollY = value;
      window.pageYOffset = value;
    },
    dispatch(type) {
      for (const handler of listeners.get(type) || []) handler();
    },
    restore() {
      Object.assign(globalThis, previous);
    },
  };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

function createControlledMediaFixture() {
  const requests = new Map();
  const fixture = createBrowserFixture({
    reduceMotion: false,
    fetchImpl: url => new Promise((resolve, reject) => {
      requests.set(url, { resolve, reject });
    }),
  });

  async function waitForRequest(url) {
    while (!requests.has(url)) await flush();
    return requests.get(url);
  }

  fixture.resolveVideo = async (root, url) => {
    const request = await waitForRequest(url);
    request.resolve({ ok: true, blob: async () => ({ url }) });
    await flush();
    const video = root.querySelectorAll('.sw-scene__video')
      .find(candidate => candidate.src === `blob:${url}`);
    assert.ok(video, `missing video element for ${url}`);
    video.duration = 5;
    video.dispatch('loadedmetadata');
    video.dispatch('loadeddata');
    await flush();
  };

  fixture.rejectVideo = async url => {
    const request = await waitForRequest(url);
    request.reject(new Error(`failed ${url}`));
    await flush();
  };

  fixture.settlePriorityVideos = async root => {
    await Promise.all([
      fixture.resolveVideo(root, 'one.mp4'),
      fixture.resolveVideo(root, 'one-two.mp4'),
      fixture.resolveVideo(root, 'two.mp4'),
    ]);
  };

  fixture.requestedUrls = () => [...requests.keys()];

  return fixture;
}

function threeSceneFilmConfig() {
  return {
    atmosphere: false,
    nav: false,
    connScroll: 1,
    sections: [
      { id: 'one', label: 'One', still: 'one.webp', clip: 'one.mp4', scroll: 1 },
      { id: 'two', label: 'Two', still: 'two.webp', clip: 'two.mp4', scroll: 1 },
      { id: 'three', label: 'Three', still: 'three.webp', clip: 'three.mp4', scroll: 1 },
    ],
    connectors: ['one-two.mp4', 'two-three.mp4'],
  };
}

function config() {
  return {
    atmosphere: false,
    nav: false,
    sections: [{ id: 'one', label: 'One', still: '', clip: '', scroll: 1 }],
    connectors: [],
  };
}

test('video stays hidden until its scene has painted a clip', () => {
  const fixture = createBrowserFixture();
  try {
    const controller = mountScrollWorld(fixture.createRoot(), config());
    const css = fixture.document.getElementById('sw-css').textContent;

    assert.match(css, /\.sw-scene__video\{[^}]*opacity:0;[^}]*visibility:hidden;/);
    assert.match(css, /\.sw-scene\.has-clip \.sw-scene__video\{[^}]*opacity:1;[^}]*visibility:visible;/);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('priority clip fetches are idempotent and settle after decoded data', async () => {
  const requests = [];
  const fixture = createBrowserFixture({
    reduceMotion: false,
    fetchImpl: async url => {
      requests.push(url);
      return { ok: true, blob: async () => ({ url }) };
    },
  });
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      sections: [
        { id: 'one', label: 'One', still: '', clip: 'one.mp4', scroll: 1 },
        { id: 'two', label: 'Two', still: '', clip: 'two.mp4', scroll: 1 },
      ],
      connectors: ['connector.mp4'],
    });
    await flush();
    assert.deepEqual(requests, ['one.mp4', 'connector.mp4', 'two.mp4']);
    for (const video of root.querySelectorAll('.sw-scene__video')) {
      video.duration = 5;
      video.dispatch('loadedmetadata');
      video.dispatch('loadeddata');
    }
    await controller.whenReady;
    assert.equal(new Set(requests).size, 3);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('initial loader locks scrolling until priority clips settle', async () => {
  let resolveFetch;
  const fixture = createBrowserFixture({
    reduceMotion: false,
    fetchImpl: () => new Promise(resolve => { resolveFetch = resolve; }),
  });
  fixture.document.documentElement.style.overflow = 'clip';
  fixture.document.body.style.overflow = 'auto';
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      sections: [{ id: 'one', label: 'One', still: '', clip: 'one.mp4' }],
      connectors: [],
    });
    const [loader] = root.querySelectorAll('.sw-loader');
    assert.ok(loader);
    assert.equal(fixture.document.documentElement.style.overflow, 'hidden');
    assert.equal(fixture.document.body.style.overflow, 'hidden');
    resolveFetch({ ok: true, blob: async () => ({ url: 'one.mp4' }) });
    await flush();
    const [video] = root.querySelectorAll('.sw-scene__video');
    video.duration = 5;
    video.dispatch('loadedmetadata');
    video.dispatch('loadeddata');
    await controller.whenReady;
    assert.equal(loader.classList.contains('is-complete'), true);
    assert.equal(fixture.document.documentElement.style.overflow, 'clip');
    assert.equal(fixture.document.body.style.overflow, 'auto');
    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('destroy restores scrolling while priority media is pending', () => {
  const fixture = createBrowserFixture({
    reduceMotion: false,
    fetchImpl: () => new Promise(() => {}),
  });
  fixture.document.documentElement.style.overflow = '';
  fixture.document.body.style.overflow = 'scroll';
  try {
    const controller = mountScrollWorld(fixture.createRoot(), {
      atmosphere: false,
      nav: false,
      sections: [{ id: 'one', label: 'One', still: '', clip: 'pending.mp4' }],
      connectors: [],
    });
    controller.destroy();
    assert.equal(fixture.document.documentElement.style.overflow, '');
    assert.equal(fixture.document.body.style.overflow, 'scroll');
  } finally {
    fixture.restore();
  }
});

test('fast scrolling holds decoded video instead of exposing an unready poster', async () => {
  const fixture = createControlledMediaFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, threeSceneFilmConfig());
    await fixture.settlePriorityVideos(root);
    await controller.whenReady;
    const scenes = root.querySelectorAll('.sw-scene');
    fixture.setScroll(4050);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 0, 1, 0, 0]);
    assert.equal(root.querySelectorAll('.sw-chapter-loader')[0].classList.contains('is-active'), true);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('an unready incoming clip cannot leak its poster inside the crossfade band', async () => {
  const fixture = createControlledMediaFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, threeSceneFilmConfig());
    await fixture.settlePriorityVideos(root);
    await controller.whenReady;
    const scenes = root.querySelectorAll('.sw-scene');
    fixture.setScroll(2660);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 0, 1, 0, 0]);
    assert.equal(root.querySelectorAll('.sw-chapter-loader')[0].classList.contains('is-active'), true);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('fast scrolling cannot bypass the two-worker background queue', async () => {
  const fixture = createControlledMediaFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      connScroll: 1,
      sections: [
        { id: 'one', label: 'One', still: '', clip: 'one.mp4', scroll: 1 },
        { id: 'two', label: 'Two', still: '', clip: 'two.mp4', scroll: 1 },
        { id: 'three', label: 'Three', still: '', clip: 'three.mp4', scroll: 1 },
        { id: 'four', label: 'Four', still: '', clip: 'four.mp4', scroll: 1 },
        { id: 'five', label: 'Five', still: '', clip: 'five.mp4', scroll: 1 },
      ],
      connectors: [
        'one-two.mp4', 'two-three.mp4', 'three-four.mp4', 'four-five.mp4',
      ],
    });
    await fixture.settlePriorityVideos(root);
    await controller.whenReady;
    await flush();
    assert.deepEqual(fixture.requestedUrls(), [
      'one.mp4', 'one-two.mp4', 'two.mp4', 'two-three.mp4', 'three.mp4',
    ]);
    fixture.setScroll(7650);
    fixture.dispatch('resize');
    await flush();
    assert.deepEqual(fixture.requestedUrls(), [
      'one.mp4', 'one-two.mp4', 'two.mp4', 'two-three.mp4', 'three.mp4',
    ]);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('failed future video releases the readiness hold to its poster', async () => {
  const fixture = createControlledMediaFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, threeSceneFilmConfig());
    await fixture.settlePriorityVideos(root);
    await controller.whenReady;
    await fixture.resolveVideo(root, 'two-three.mp4');
    await fixture.rejectVideo('three.mp4');
    fixture.setScroll(4050);
    fixture.dispatch('resize');
    const scenes = root.querySelectorAll('.sw-scene');
    assert.equal(Number(scenes[4].style.opacity), 1);
    assert.equal(scenes[4].classList.contains('has-clip'), false);
    assert.equal(root.querySelectorAll('.sw-chapter-loader')[0].classList.contains('is-active'), false);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('engine stylesheet remains until the last simultaneous mount is destroyed', () => {
  const fixture = createBrowserFixture();
  try {
    const first = mountScrollWorld(fixture.createRoot(), config());
    const stylesheet = fixture.document.getElementById('sw-css');
    const second = mountScrollWorld(fixture.createRoot(), config());

    first.destroy();
    assert.equal(fixture.document.getElementById('sw-css'), stylesheet);

    second.destroy();
    assert.equal(fixture.document.getElementById('sw-css'), null);
  } finally {
    fixture.restore();
  }
});

test('destroy never removes a pre-existing external sw-css stylesheet', () => {
  const fixture = createBrowserFixture();
  try {
    const external = fixture.document.createElement('style');
    external.id = 'sw-css';
    external.textContent = '/* external */';
    fixture.document.head.appendChild(external);

    const controller = mountScrollWorld(fixture.createRoot(), config());
    controller.destroy();

    assert.equal(fixture.document.getElementById('sw-css'), external);
    assert.equal(external.textContent, '/* external */');
  } finally {
    fixture.restore();
  }
});

test('scene layers preserve full coverage without changing stacking order', () => {
  const fixture = createBrowserFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      crossfade: 0.08,
      sections: [
        { id: 'one', label: 'One', still: '', clip: '', scroll: 1 },
        { id: 'two', label: 'Two', still: '', clip: '', scroll: 1 },
      ],
      connectors: [null],
    });
    const scenes = root.querySelectorAll('.sw-scene');
    const initialStack = scenes.map(scene => scene.style.zIndex);
    const coverage = () => {
      const [lower, upper] = scenes.map(scene => Number(scene.style.opacity));
      return upper + lower * (1 - upper);
    };

    fixture.setScroll(864);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [1, 0]);
    assert.equal(coverage(), 1);

    fixture.setScroll(900);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [1, 0.5]);
    assert.equal(coverage(), 1);
    assert.deepEqual(scenes.map(scene => scene.style.zIndex), initialStack);

    fixture.setScroll(936);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [1, 1]);
    assert.equal(coverage(), 1);
    assert.deepEqual(scenes.map(scene => scene.style.zIndex), initialStack);

    fixture.setScroll(937);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 1]);
    assert.equal(coverage(), 1);
    assert.deepEqual(scenes.map(scene => scene.style.zIndex), initialStack);

    fixture.setScroll(900);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [1, 0.5]);
    assert.deepEqual(scenes.map(scene => scene.style.zIndex), initialStack);

    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('incoming scene crossfade override is converted from viewport units', () => {
  const fixture = createBrowserFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      crossfade: 0.08,
      connScroll: 1,
      sections: [
        { id: 'one', label: 'One', still: '', clip: '', scroll: 1 },
        { id: 'two', label: 'Two', still: '', clip: '', scroll: 1, crossfadeIn: 0.16 },
      ],
      connectors: ['connector.mp4'],
    });
    const scenes = root.querySelectorAll('.sw-scene');

    fixture.setScroll(846); // outside the default 72px first seam band
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [1, 0, 0]);

    fixture.setScroll(1746); // inside the overridden 144px connector-to-scene band
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 1, 0.04296875]);

    fixture.setScroll(1800); // midpoint remains an even incoming blend
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 1, 0.5]);

    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('after-boundary scene fade keeps the connector alone through its endpoint', () => {
  const fixture = createBrowserFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      crossfade: 0.08,
      connScroll: 1,
      sections: [
        { id: 'one', label: 'One', still: '', clip: '', scroll: 1 },
        {
          id: 'two', label: 'Two', still: '', clip: '', scroll: 1,
          crossfadeIn: 0.16, crossfadeAfter: true,
        },
      ],
      connectors: ['connector.mp4'],
    });
    const scenes = root.querySelectorAll('.sw-scene');
    assert.equal(scenes[2].style.transition, 'opacity 160ms linear');

    fixture.setScroll(1799);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 1, 0]);

    fixture.setScroll(1800); // connector endpoint and incoming-scene start
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 1, 0]);

    fixture.setScroll(1836); // 25% through the 144px post-boundary fade
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 1, 0.15625]);

    fixture.setScroll(1872); // midpoint of the post-boundary fade
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 1, 0.5]);

    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('a completed after-boundary fade cannot block a later scene', () => {
  const fixture = createBrowserFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      crossfade: 0.08,
      connScroll: 1,
      sections: [
        { id: 'one', label: 'One', still: '', clip: '', scroll: 1 },
        {
          id: 'two', label: 'Two', still: '', clip: '', scroll: 1,
          crossfadeIn: 0.16, crossfadeAfter: true,
        },
        { id: 'three', label: 'Three', still: '', clip: '', scroll: 1 },
      ],
      connectors: ['connector-one.mp4', 'connector-two.mp4'],
    });
    const scenes = root.querySelectorAll('.sw-scene');
    const specialScene = scenes[2];
    const finishSpecialTransition = () => {
      for (const handler of specialScene.listeners.get('transitionend') || []) {
        handler({ propertyName: 'opacity' });
      }
    };

    fixture.setScroll(1945); // first pixel after the post-boundary fade into scene two
    fixture.dispatch('resize');
    finishSpecialTransition();
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 0, 1, 0, 0]);

    fixture.setScroll(4050); // middle of scene three
    fixture.dispatch('resize');
    finishSpecialTransition(); // scene two has now finished fading out
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 0, 0, 0, 1]);

    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('directional copy backdrop follows readable copy and clears connectors', () => {
  const fixture = createBrowserFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      hero: { copySide: 'right', title: 'Hero', scroll: 0.5 },
      connScroll: 0.5,
      sections: [
        { id: 'one', label: 'One', copySide: 'right', still: '', clip: '', scroll: 1 },
        { id: 'two', label: 'Two', copySide: 'left', still: '', clip: '', scroll: 1 },
      ],
      connectors: ['connector.mp4'],
    });

    const backdrops = root.querySelectorAll('.sw-copy-backdrop');
    const [backdrop] = backdrops;
    const [hero] = root.querySelectorAll('.sw-hero');
    const copies = root.querySelectorAll('.sw-copy');
    const css = fixture.document.getElementById('sw-css').textContent;

    assert.equal(backdrops.length, 1);
    assert.equal(hero.dataset.side, 'right');
    assert.deepEqual(copies.map(copy => copy.dataset.side), ['right', 'left']);
    assert.match(css, /\.sw-copy-backdrop\[data-side="right"\]\{[^}]*transform:scaleX\(-1\)/);
    assert.doesNotMatch(css, /\.sw-copylayer::before/);

    fixture.setScroll(0);
    fixture.dispatch('resize');
    assert.equal(backdrop.dataset.side, 'right');
    assert.equal(Number(backdrop.style.opacity), 1);

    fixture.setScroll(600);
    fixture.dispatch('resize');
    assert.equal(Number(backdrop.style.opacity), Number(copies[0].style.opacity));
    assert.ok(Number(backdrop.style.opacity) > 0 && Number(backdrop.style.opacity) < 1);

    fixture.setScroll(900); // center of first dive
    fixture.dispatch('resize');
    assert.equal(backdrop.dataset.side, 'right');
    assert.equal(Number(backdrop.style.opacity), 1);

    fixture.setScroll(1575); // center of connector
    fixture.dispatch('resize');
    assert.equal(Number(backdrop.style.opacity), 0);
    assert.deepEqual(copies.map(copy => Number(copy.style.opacity)), [0, 0]);

    fixture.setScroll(2250); // center of second dive
    fixture.dispatch('resize');
    assert.equal(backdrop.dataset.side, 'left');
    assert.equal(Number(backdrop.style.opacity), 1);

    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('still posters remain centered and full bleed while retaining fallback zoom', () => {
  const fixture = createBrowserFixture({ reduceMotion: false });
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, config());
    const [still] = root.querySelectorAll('.sw-scene__still');

    assert.equal(still.style.transform, 'scale(1.030)');
    assert.doesNotMatch(still.style.transform, /translateX/);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});
