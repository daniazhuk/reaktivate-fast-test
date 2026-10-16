import { createAppStores } from '@/Shared/Stores/createAppStores';
import { FakeBooksGateway } from './FakeBooksGateway';

export const TEST_USER = 'tester';

export function createTestStores(gateway = new FakeBooksGateway(), userId = TEST_USER) {
  return { gateway, ...createAppStores({ gateway, userId }) };
}

/** Lets pending promise callbacks (fake API responses) run. */
export const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
