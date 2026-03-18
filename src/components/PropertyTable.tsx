import { cn } from "@/lib/utils";

export interface Property {
  id: string;
  name: string;
  type: string;
  location: string;
  sf: number;
  occupancy: number;
  noi: number;
  capRate: number;
  ltv: number;
  irr: number;
}

interface PropertyTableProps {
  properties: Property[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n}`;

const PropertyTable = ({ properties, selectedId, onSelect }: PropertyTableProps) => {
  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Property", "Type", "Location", "SF", "Occupancy", "NOI", "Cap Rate", "LTV", "IRR"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={cn(
                  "border-b border-border cursor-pointer transition-colors duration-100",
                  selectedId === p.id
                    ? "bg-primary/5"
                    : "hover:bg-muted/30"
                )}
              >
                <td className="px-4 py-2.5 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.type}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.location}</td>
                <td className="px-4 py-2.5 font-mono text-foreground">
                  {p.sf.toLocaleString()}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "font-mono",
                      p.occupancy >= 90 ? "text-success" : p.occupancy >= 75 ? "text-foreground" : "text-destructive"
                    )}
                  >
                    {p.occupancy}%
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-foreground">{fmt(p.noi)}</td>
                <td className="px-4 py-2.5 font-mono text-success">{p.capRate.toFixed(1)}%</td>
                <td className="px-4 py-2.5 font-mono text-foreground">{p.ltv}%</td>
                <td className="px-4 py-2.5 font-mono text-success">{p.irr.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertyTable;
