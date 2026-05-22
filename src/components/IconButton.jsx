export default function IconButton({
  title,
  onClick,
  children,
  active = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`group inline-flex items-center justify-center h-9 w-9 rounded-md border transition-all duration-200 ${
        active
          ? "border-[var(--color-space-accent)] text-white bg-[var(--color-space-accent)]/15 shadow-[0_0_18px_var(--color-space-accent-glow)]"
          : "border-[var(--color-space-border)] text-[var(--color-space-muted)] hover:text-white hover:border-[var(--color-space-border-strong)] hover:bg-white/[0.04]"
      } ${className}`}
    >
      {children}
    </button>
  );
}
