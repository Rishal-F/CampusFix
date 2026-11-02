export function Button({ children, icon: Icon, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`button button--${variant} ${className}`.trim()} {...props}>
      {Icon && <Icon size={17} strokeWidth={2.1} />}
      <span>{children}</span>
    </button>
  );
}
