import { configure } from 'mobx';
import ApiGateway from '@/Shared/ApiGateway';
import { API_USER } from '@/Shared/config';
import { createAppStores } from '@/Shared/Stores/createAppStores';

configure({ enforceActions: 'always' });

export const stores = createAppStores({ gateway: new ApiGateway(), userId: API_USER });
