type Disposer = () => void;

/** Collects reaction disposers so a controller can release them in one call. */
export class DisposerBag {
  private disposers: Disposer[] = [];

  add(disposer: Disposer): void {
    this.disposers.push(disposer);
  }

  get size(): number {
    return this.disposers.length;
  }

  dispose(): void {
    this.disposers.splice(0).forEach((dispose) => dispose());
  }
}
