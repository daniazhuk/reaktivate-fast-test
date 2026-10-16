type Disposer = () => void;

/** Collects reaction disposers so a controller can release them in one call. */
export class DisposerBag {
  private disposers: Disposer[] = [];

  add(disposer: Disposer): void {
    this.disposers.push(disposer);
  }

  dispose(): void {
    this.disposers.splice(0).forEach((dispose) => dispose());
  }
}
