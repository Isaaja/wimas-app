interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, color, className = "" }) => {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        color ?? "bg-blue-100 text-blue-800"
      } ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
