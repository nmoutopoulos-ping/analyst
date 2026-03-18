import { X } from "lucide-react";
import type { Property } from "./PropertyTable";

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
}

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n}`;

const Row = ({ label, value, mono = false, color }: { label: string; value: string; mono?: boolean; color?: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-border">
    <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-medium ${mono ? "font-mono" : ""} ${color || "text-foreground"}`}>
      {value}
    </span>
  </div>
);

const PropertyDetail = ({ property, onClose }: PropertyDetailProps) => {
  return (
    <div className="w-96 border-l border-border bg-card h-full overflow-y-auto animate-slide-in-right">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{property.name}</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors duration-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-0">
        <Row label="Type" value={property.type} />
        <Row label="Location" value={property.location} />
        <Row label="Square Footage" value={property.sf.toLocaleString()} mono />
        <Row label="Occupancy" value={`${property.occupancy}%`} mono color={property.occupancy >= 90 ? "text-success" : ""} />
        <Row label="NOI" value={fmt(property.noi)} mono />
        <Row label="Cap Rate" value={`${property.capRate.toFixed(2)}%`} mono color="text-success" />
        <Row label="LTV" value={`${property.ltv}%`} mono />
        <Row label="IRR" value={`${property.irr.toFixed(2)}%`} mono color="text-success" />
      </div>

      <div className="px-5 py-4 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Cash Flow Projection
        </h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((yr) => {
            const projected = property.noi * (1 + 0.03 * yr);
            return (
              <div key={yr} className="flex justify-between text-xs">
                <span className="text-muted-foreground">Year {yr}</span>
                <span className="font-mono text-foreground">{fmt(projected)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Debt Analysis
        </h3>
        <div className="space-y-0">
          <Row label="Loan Amount" value={fmt(property.noi / (property.capRate / 100) * (property.ltv / 100))} mono />
          <Row label="DSCR" value={(property.noi / (property.noi * 0.6)).toFixed(2) + "x"} mono />
          <Row label="Debt Yield" value={((property.noi / (property.noi / (property.capRate / 100) * (property.ltv / 100))) * 100).toFixed(1) + "%"} mono />
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
