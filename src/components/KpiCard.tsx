import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

const KpiCard = ({ label, value, change, positive }: KpiCardProps) => {
  return (
    <div className="bg-card rounded-sm border border-border p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold font-mono text-card-foreground">
        {value}
      </p>
      {change && (
        <p
          className={cn(
            "text-xs font-mono mt-1",
            positive ? "text-success" : "text-destructive"
          )}
        >
          {positive ? "▲" : "▼"} {change}
        </p>
      )}
    </div>
  );
};

export default KpiCard;
