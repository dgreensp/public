function addTimes(a, b) {
  const [secsA, nanosA] = a;
  const [secsB, nanosB] = b;
  let totalNanos = nanosA + nanosB;
  let totalSecs = secsA + secsB;
  while (totalNanos >= 1e9) {
    totalNanos -= 1e9;
    totalSecs++;
  }
  return [totalSecs, totalNanos];
}
