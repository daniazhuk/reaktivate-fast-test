import { observer } from 'mobx-react';
import { useController } from '@/Shared/Lifecycle/useController';
import HeaderController from './Header.controller';

export const HeaderView = observer(() => {
  const controller = useController(HeaderController.create);

  return (
    <header className="app-header">
      <span className="app-header__title">{controller.title}</span>
      <span className="app-header__counter" data-testid="private-books-counter">
        {controller.counterLabel}
      </span>
    </header>
  );
});
