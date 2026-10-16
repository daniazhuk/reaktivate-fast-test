import { DisposerBag } from './DisposerBag';

describe('DisposerBag', () => {
  it('calls every disposer once and empties itself', () => {
    const bag = new DisposerBag();
    const a = vi.fn();
    const b = vi.fn();
    bag.add(a);
    bag.add(b);

    bag.dispose();
    bag.dispose();

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(bag.size).toBe(0);
  });
});
