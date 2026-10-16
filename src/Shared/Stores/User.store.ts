import { makeAutoObservable } from 'mobx';

/** Application-wide user data. The API identifies a user by nickname only. */
export default class UserStore {
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }
}
