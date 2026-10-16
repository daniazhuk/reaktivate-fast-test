export type TabVm = {
  key: string;
  label: string;
  isActive: boolean;
  select: () => void;
};

type Props = {
  label: string;
  tabs: TabVm[];
};

export const Tabs = ({ label, tabs }: Props) => (
  <div className="tabs" role="tablist" aria-label={label}>
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        className="tabs__tab"
        aria-selected={tab.isActive}
        onClick={tab.select}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
