export default function PalettePicker({ palettes, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {palettes.map((p, i) => {
        const selected = i === value;
        return (
          <button
            key={p.name}
            type="button"
            onClick={() => onChange(i)}
            className={`group relative h-9 rounded-md overflow-hidden border transition-all duration-200 text-left ${
              selected
                ? "border-white shadow-[0_0_14px_var(--color-space-accent-glow)]"
                : "border-[var(--color-space-border)] hover:border-[var(--color-space-border-strong)]"
            }`}
            title={p.name}
          >
            <span
              className="absolute inset-0"
              style={{ background: p.previewCSS }}
            />
            <span className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors" />
            <span className="relative z-10 flex h-full items-center px-2 text-[10.5px] uppercase tracking-[0.12em] text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
              {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
