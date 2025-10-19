// app/components/admin/StatCard.tsx
interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number | string;
  subtitle: string;
  color: "blue" | "green" | "purple" | "red" | "orange";
  compact?: boolean;
}

export default function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  compact = false,
}: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    red: "bg-red-50 border-red-200 text-red-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
  };

  if (compact) {
    return (
      <div
        className={`rounded-lg border p-3 shadow-lg bg-white ${colorClasses[color]}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span className="font-medium text-xs">{title}</span>
          </div>
        </div>
        <div className="mt-2">
          <div className="text-lg font-bold">{value}</div>
          <div className="text-xs opacity-75 mt-1">{subtitle}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6" />
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
          <div className="text-sm opacity-75 mt-1">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
