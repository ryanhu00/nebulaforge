export default function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}) {
  const fill = ((value - min) / (max - min)) * 100;
  const display =
    typeof format === "function"
      ? format(value)
      : step >= 1
      ? Math.round(value).toString()
      : Number(value).toFixed(2);

  return (
    <label className="block select-none">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-space-muted)]">
          {label}
        </span>
        <span className="font-[var(--font-mono)] text-[11px] tabular-nums text-white/85">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ "--fill": `${fill}%` }}
      />
    </label>
  );
}
