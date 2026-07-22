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

function createBrowserFixture({ reduceMotion = true } = {}) {
  const head = new FakeElement('head');
  const body = new FakeElement('body');
  const document = {
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
  };
  globalThis.window = window;
  globalThis.document = document;
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};

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
