// Minimal in-memory stand-in for the Upstash client methods guardedClaude uses.
// Every method yields to the event loop first, so concurrent callers interleave the
// way real network round-trips do.
export class FakeRedis {
  store = new Map<string, number>();
  private tick = () => new Promise((r) => setTimeout(r, 0));
  async get<T>(k: string): Promise<T | null> {
    await this.tick();
    return (this.store.has(k) ? this.store.get(k) : null) as T | null;
  }
  async incr(k: string) {
    await this.tick();
    const n = (this.store.get(k) ?? 0) + 1;
    this.store.set(k, n);
    return n;
  }
  async decr(k: string) {
    await this.tick();
    const n = (this.store.get(k) ?? 0) - 1;
    this.store.set(k, n);
    return n;
  }
  async expire() {
    await this.tick();
    return 1;
  }
  total(prefix: string) {
    let s = 0;
    for (const [k, v] of Array.from(this.store)) if (k.startsWith(prefix)) s += v;
    return s;
  }
}
