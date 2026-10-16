import type { ChangeEventHandler } from 'react';

type Props = {
  label: string;
  name: string;
  value: string;
  disabled: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export const TextFieldView = ({ label, name, value, disabled, onChange }: Props) => (
  <label className="text-field">
    <span className="text-field__label">{label}</span>
    <input className="text-field__input" name={name} value={value} disabled={disabled} onChange={onChange} />
  </label>
);
