import test from 'node:test';
import assert from 'node:assert/strict';
import { getExperienceMode } from '../src/main.js';

test('desktop receives film mode', () => {
  assert.equal(getExperienceMode({ reduced: false, coarse: false, small: false }), 'film');
});

test('phone, coarse pointer, and reduced motion receive posters', () => {
  assert.equal(getExperienceMode({ reduced: true, coarse: false, small: false }), 'posters');
  assert.equal(getExperienceMode({ reduced: false, coarse: true, small: false }), 'posters');
  assert.equal(getExperienceMode({ reduced: false, coarse: false, small: true }), 'posters');
});
