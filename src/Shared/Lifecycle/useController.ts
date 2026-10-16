import { useEffect, useState } from 'react';
import type { AppStores } from '@/Shared/Stores/createAppStores';
import { useStores } from '@/Shared/Stores/Stores.context';
import type { Controller } from './Controller';

export type ControllerFactory<C extends object> = (stores: AppStores) => C;

/**
 * Creates a controller once per component instance and binds its lifecycle
 * to the component: `mount` after the first render, `unmount` on teardown.
 */
export function useController<C extends object>(factory: ControllerFactory<C>): C {
  const stores = useStores();
  const [controller] = useState(() => factory(stores));

  useEffect(() => {
    const lifecycle: Controller = controller;
    lifecycle.mount?.();
    return () => lifecycle.unmount?.();
  }, [controller]);

  return controller;
}
