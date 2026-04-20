const Card = ({
  title,
  description,
  actions,
  children,
  className = "",
  bodyClassName = "p-5",
}) => {
  return (
    <div
      className={`rounded-xl border border-line bg-surface shadow-sm ${className}`}
    >
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-muted">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};

export default Card;
