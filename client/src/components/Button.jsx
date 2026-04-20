const variants = {
  primary:
    "bg-brand text-white hover:bg-brand-hover disabled:bg-brand/60",
  secondary:
    "bg-white text-ink border border-line hover:bg-gray-50 disabled:opacity-60",
  success: "bg-success text-white hover:opacity-90 disabled:opacity-60",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-60",
  ghost: "text-muted hover:text-ink hover:bg-gray-100",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) => {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
