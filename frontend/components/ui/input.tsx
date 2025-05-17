// components/InputField.tsx
type Props = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
};

export default function InputField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
}: Props) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
