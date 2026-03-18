import { useState, useMemo } from "react";
import AppSidebar from "@/components/AppSidebar";
import KpiCard from "@/components/KpiCard";
import PropertyTable from "@/components/PropertyTable";
import PropertyDetail from "@/components/PropertyDetail";
import { properties } from "@/data/properties";

const Index = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedId) ?? null,
    [selectedId]
  );

  const totalNoi = properties.reduce((s, p) => s + p.noi, 0);
  const avgCapRate = properties.reduce((s, p) => s + p.capRate, 0) / properties.length;
  const avgOccupancy = properties.reduce((s, p) => s + p.occupancy, 0) / properties.length;
  const avgLtv = properties.reduce((s, p) => s + p.ltv, 0) / properties.length;
  const totalSf = properties.reduce((s, p) => s + p.sf, 0);

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : `$${(n / 1_000).toFixed(0)}K`;

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />

      <div className="flex-1 ml-56 flex">
        <div className="flex-1 min-w-0">
          <header className="border-b border-border bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Portfolio Dashboard</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {properties.length} properties · {(totalSf / 1_000_000).toFixed(1)}M SF
                </p>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Updated Mar 18, 2026
              </div>
            </div>
          </header>

          <main className="p-6 space-y-5">
            <div className="grid grid-cols-5 gap-3">
              <KpiCard label="Total NOI" value={fmt(totalNoi)} change="3.2% YoY" positive />
              <KpiCard label="Avg Cap Rate" value={`${avgCapRate.toFixed(1)}%`} change="10bps" positive />
              <KpiCard label="Avg Occupancy" value={`${avgOccupancy.toFixed(1)}%`} change="1.4%" positive />
              <KpiCard label="Avg LTV" value={`${avgLtv.toFixed(0)}%`} change="2.1%" positive={false} />
              <KpiCard label="Total SF" value={`${(totalSf / 1_000_000).toFixed(1)}M`} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Property Listings</h2>
              </div>
              <PropertyTable
                properties={properties}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
              />
            </div>
          </main>
        </div>

        {selectedProperty && (
          <PropertyDetail
            property={selectedProperty}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
