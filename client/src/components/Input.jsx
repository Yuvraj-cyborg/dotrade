const Input = ({ label, error, className = "", ...rest }) => {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-ink">{label}</span>
      )}
      <input
        {...rest}
        className={`h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : ""
        } ${className}`}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
};

export default Input;
