export function selectPriorityIndices(segments, position, count = 3) {
  const available = segments
    .map((segment, index) => (segment.clip ? index : -1))
    .filter(index => index >= 0);
  if (!available.length || count <= 0) return [];

  let activeIndex = available[0];
  for (const index of available) {
    if (position >= segments[index].start) activeIndex = index;
  }
  const activeOffset = available.indexOf(activeIndex);
  const size = Math.min(count, available.length);
  const start = Math.max(0, Math.min(activeOffset - 1, available.length - size));
  return available.slice(start, start + size);
}

export function backgroundPreloadOrder(segments, priorityIndices, activeIndex) {
  const priority = new Set(priorityIndices);
  const available = segments
    .map((segment, index) => (segment.clip && !priority.has(index) ? index : -1))
    .filter(index => index >= 0);
  return [
    ...available.filter(index => index > activeIndex).sort((a, b) => a - b),
    ...available.filter(index => index < activeIndex).sort((a, b) => b - a),
  ];
}

export async function runPreloadQueue(items, worker, concurrency = 2) {
  const queue = [...items];
  const workerCount = Math.min(Math.max(1, concurrency), queue.length);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  }));
}
