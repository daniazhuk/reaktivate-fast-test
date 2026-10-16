import { observer } from 'mobx-react';
import { useController } from '@/Shared/Lifecycle/useController';
import HeaderController from './Header.controller';

export const HeaderView = observer(() => {
  const controller = useController(HeaderController.create);

  return (
    <header className="app-header">
      <span className="app-header__title">{controller.title}</span>
      <span className="app-header__counter">
        <span role="status">{controller.counterLabel}</span>{' '}
        <button type="button" hidden={controller.isRetryHidden} onClick={controller.retry}>
          {controller.retryLabel}
        </button>
      </span>
    </header>
  );
});
