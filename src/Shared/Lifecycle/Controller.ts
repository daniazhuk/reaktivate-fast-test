/**
 * Lifecycle hooks of a local (per-component) controller, driven by `useController`.
 * Both must be idempotent: React StrictMode mounts, unmounts and re-mounts the same instance.
 */
export interface Controller {
  mount?(): void;
  unmount?(): void;
}
