export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function smoothstep(value) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

export function segmentLayerOpacities(position, segments, crossfade) {
  const opacities = Array(segments.length).fill(0);
  if (!segments.length) return opacities;
  const defaultBand = Number.isFinite(crossfade) ? Math.max(0, crossfade) : 0;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const nextSegment = segments[index + 1];
    const band = Number.isFinite(nextSegment.crossfadeIn)
      ? Math.max(0, nextSegment.crossfadeIn)
      : defaultBand;
    if (band <= 0) continue;
    const boundary = nextSegment.start;
    const bandStart = boundary - band / 2;
    const bandEnd = boundary + band / 2;
    if (position < bandStart || position > bandEnd) continue;
    const incoming = smoothstep((position - bandStart) / band);
    opacities[index] = 1;
    opacities[index + 1] = incoming;
    return opacities;
  }

  let active = 0;
  for (let index = 1; index < segments.length; index += 1) {
    if (position >= segments[index].start) active = index;
  }
  opacities[active] = 1;
  return opacities;
}

export function lingerEase(value, linger = 0) {
  const x = clamp(value);
  const amount = clamp(linger);
  const centered = x - 0.5;
  return (1 - amount) * x + amount * (4 * centered ** 3 + 0.5);
}

export function buildSegments({ sections, connectors, diveScroll, connScroll, heroScroll = 0 }) {
  const result = [];
  let cursor = heroScroll;
  sections.forEach((section, sectionIndex) => {
    const width = section.scroll ?? diveScroll;
    const dive = { kind: 'dive', sectionIndex, start: cursor, end: cursor + width, width, linger: section.linger ?? 0 };
    result.push(dive);
    cursor = dive.end;
    if (sectionIndex < sections.length - 1 && connectors[sectionIndex]) {
      const connector = { kind: 'connector', sectionIndex, start: cursor, end: cursor + connScroll, width: connScroll, linger: 0 };
      result.push(connector);
      cursor = connector.end;
    }
  });
  return result;
}

export function heroOpacity(position, heroScroll) {
  if (!heroScroll) return 0;
  return smoothstep(1 - clamp(position / heroScroll));
}

export function sectionCopyOpacity({ index, count, position, segment, hasHero }) {
  const progress = clamp((position - segment.start) / (segment.end - segment.start));
  const before = position < segment.start;
  const after = position > segment.end;
  if (index === 0 && hasHero) {
    if (before || after) return 0;
    return smoothstep(progress / 0.24) * smoothstep(1 - Math.max(0, progress - 0.72) / 0.28);
  }
  if (index === 0) return after ? 0 : smoothstep(1 - progress / 0.62);
  if (index === count - 1) return before ? 0 : smoothstep(progress / 0.4);
  return before || after ? 0 : smoothstep(1 - Math.abs(progress - 0.5) / 0.5);
}

export function activeSectionIndex(position, segments, count) {
  let current = segments[0];
  for (const segment of segments) if (position >= segment.start) current = segment;
  const raw = current.kind === 'dive'
    ? current.sectionIndex
    : current.sectionIndex + ((position - current.start) / current.width > 0.5 ? 1 : 0);
  return clamp(raw, 0, count - 1);
}
