import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Layers as LayersIcon,
  Filter as FilterIcon,
  Palette,
  Info,
  Wand2,
  ChevronUp,
  Search,
  Eye,
  EyeOff,
  RotateCcw,
  Share2,
} from "lucide-react";

/**
 * Map Bottom Sheet with Tabs
 *
 * A mobile-first, accessible control hub for your genealogy map.
 * - Floating FAB opens a bottom sheet (peek height ≈ 33vh; expandable to 85vh)
 * - Tabs: Explore (presets), Layers, Filters, Styles, Legend
 * - All state can be managed internally or lifted via callbacks
 *
 * Hook into your map by wiring the callbacks (onPresetApply, onLayerChange, etc.)
 * to your react-leaflet or state store logic.
 */

// ---------------------- Types ----------------------
export type Preset = {
  id: string;
  name: string;
  description?: string;
};

export type LayerGroup = "People" | "Places" | "Paths" | "Events" | "Context";

export type LayerModel = {
  id: string;
  name: string;
  group: LayerGroup;
  visible: boolean;
  opacity: number; // 0..1
  labels: boolean;
};

export type FiltersModel = {
  roles: string[]; // e.g., ["direct", "spouse", "descendant"]
  branches: string[]; // e.g., ["maternal", "paternal"]
  surnames: string[]; // selection
  timeRange: [number, number]; // e.g., [1750, 2025]
  placeTypes: string[]; // ["country","state","county","city","cemetery"]
  events: string[]; // ["birth","death","marriage","military","residence"]
};

export type StylesModel = {
  colorBy: "era" | "branch" | "surname" | "eventType" | "none";
  thicknessBy: "distance" | "importance" | "none";
  pointShape: "auto" | "simple";
  labelFields: string[]; // e.g., ["primary_name","year","place"]
  theme: "auto" | "light" | "dark" | "colorblind";
};

export type LegendKey = {
  id: string;
  label: string;
  symbol: React.ReactNode;
  count?: number;
};

// ---------------------- Props ----------------------
interface MapBottomSheetProps {
  presets?: Preset[];
  layers?: LayerModel[];
  filters?: FiltersModel;
  styles?: StylesModel;
  legendKeys?: LegendKey[]; // context-aware legend items

  // Callbacks (optional). If omitted, component uses internal state only.
  onPresetApply?: (presetId: string) => void;
  onLayerChange?: (layerId: string, patch: Partial<LayerModel>) => void;
  onFiltersChange?: (patch: Partial<FiltersModel>) => void;
  onStylesChange?: (patch: Partial<StylesModel>) => void;
  onClearFilters?: () => void;
  onResetView?: () => void;
  onShareView?: () => void;
  onLegendKeyClick?: (legendKeyId: string) => void; // highlight/isolate intent
}

// ---------------------- Defaults ----------------------
const DEFAULT_PRESETS: Preset[] = [
  { id: "migration", name: "Migration Paths", description: "Arrows birth → death; color by era; thickness by distance." },
  { id: "events", name: "Life Events", description: "Birth/Death/Marriage/Military icons clustered by place." },
  { id: "branches", name: "Branches", description: "Maternal vs paternal lines; optional surname groups." },
  { id: "burials", name: "Burials & Cemeteries", description: "Cemeteries with linked people highlighted." },
  { id: "timeline", name: "Timeline Focus", description: "Use the time slider; dim outside range." },
];

const DEFAULT_LAYERS: LayerModel[] = [
  { id: "people", name: "People (points)", group: "People", visible: true, opacity: 1, labels: true },
  { id: "places", name: "Places (gazetteer)", group: "Places", visible: false, opacity: 0.85, labels: false },
  { id: "paths", name: "Paths (birth→death)", group: "Paths", visible: true, opacity: 0.9, labels: false },
  { id: "events", name: "Events (all)", group: "Events", visible: false, opacity: 1, labels: false },
  { id: "cemeteries", name: "Cemeteries", group: "Places", visible: false, opacity: 1, labels: false },
  { id: "basemap", name: "Basemap", group: "Context", visible: true, opacity: 1, labels: false },
];

const DEFAULT_FILTERS: FiltersModel = {
  roles: ["direct"],
  branches: [],
  surnames: [],
  timeRange: [1750, 2025],
  placeTypes: [],
  events: [],
};

const DEFAULT_STYLES: StylesModel = {
  colorBy: "era",
  thicknessBy: "distance",
  pointShape: "auto",
  labelFields: ["primary_name", "year"],
  theme: "auto",
};

const DEFAULT_LEGEND: LegendKey[] = [
  { id: "birth", label: "Birth", symbol: <span className="inline-block h-3 w-3 rounded-full border" />, count: 142 },
  { id: "death", label: "Death", symbol: <span className="inline-block h-3 w-3 rounded-full border border-dashed" />, count: 136 },
  { id: "marriage", label: "Marriage", symbol: <span className="inline-block h-3 w-3 rotate-45 border" />, count: 48 },
  { id: "military", label: "Military", symbol: <span className="inline-block h-3 w-3 border-[2px]" />, count: 11 },
  { id: "distanceBins", label: "Arrow thickness = distance", symbol: <span className="inline-block w-8 border-b-4" /> },
];

// ---------------------- Component ----------------------
export default function MapBottomSheet({
  presets = DEFAULT_PRESETS,
  layers: layersProp,
  filters: filtersProp,
  styles: stylesProp,
  legendKeys: legendProp,
  onPresetApply,
  onLayerChange,
  onFiltersChange,
  onStylesChange,
  onClearFilters,
  onResetView,
  onShareView,
  onLegendKeyClick,
}: MapBottomSheetProps) {
  // Internal state if no external store is provided
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false); // peek vs full

  const [layers, setLayers] = useState<LayerModel[]>(() => layersProp ?? DEFAULT_LAYERS);
  const [filters, setFilters] = useState<FiltersModel>(() => filtersProp ?? DEFAULT_FILTERS);
  const [styles, setStyles] = useState<StylesModel>(() => stylesProp ?? DEFAULT_STYLES);
  const legend = legendProp ?? DEFAULT_LEGEND;

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.roles.length) n++;
    if (filters.branches.length) n++;
    if (filters.surnames.length) n++;
    if (filters.placeTypes.length) n++;
    if (filters.events.length) n++;
    // timeRange considered active if not default
    if (filters.timeRange[0] !== 1750 || filters.timeRange[1] !== 2025) n++;
    return n;
  }, [filters]);

  const groupedLayers = useMemo(() => {
    const groups: Record<LayerGroup, LayerModel[]> = {
      People: [], Places: [], Paths: [], Events: [], Context: [],
    };
    (layersProp ?? layers).forEach(l => groups[l.group].push(l));
    return groups;
  }, [layersProp, layers]);

  function patchLayer(id: string, patch: Partial<LayerModel>) {
    if (onLayerChange) return onLayerChange(id, patch);
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
  }

  function patchFilters(patch: Partial<FiltersModel>) {
    if (onFiltersChange) return onFiltersChange(patch);
    setFilters(prev => ({ ...prev, ...patch }));
  }

  function patchStyles(patch: Partial<StylesModel>) {
    if (onStylesChange) return onStylesChange(patch);
    setStyles(prev => ({ ...prev, ...patch }));
  }

  function handlePresetApply(id: string) {
    if (onPresetApply) onPresetApply(id);
    // Sensible demo defaults for internal mode switching
    if (!onPresetApply) {
      if (id === "migration") {
        patchStyles({ colorBy: "era", thicknessBy: "distance" });
        patchLayer("paths", { visible: true });
      } else if (id === "branches") {
        patchStyles({ colorBy: "branch", thicknessBy: "importance" });
        patchLayer("paths", { visible: true });
      } else if (id === "events") {
        patchLayer("events", { visible: true });
      }
    }
  }

  function clearFilters() {
    if (onClearFilters) return onClearFilters();
    setFilters(DEFAULT_FILTERS);
  }

  const sheetHeight = expanded ? "h-[85vh]" : "h-[33vh]";

  return (
    <div className="pointer-events-none">
      {/* Floating Action Button */}
      <div className="pointer-events-auto fixed bottom-4 right-4 z-[500] flex gap-2">
        <Button
          size="lg"
          className="rounded-full shadow-xl px-5 py-6 text-base"
          onClick={() => setOpen(true)}
        >
          <LayersIcon className="mr-2 h-5 w-5" /> Layers
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
          )}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setExpanded(false); }}>
        <SheetContent side="bottom" className={`p-0 ${sheetHeight} rounded-t-2xl border-t shadow-2xl`}> 
          <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2">
            {/* Drag handle (toggles expanded state) */}
            <button
              aria-label="Expand panel"
              className="h-6 w-20 rounded-full bg-muted/80 hover:bg-muted"
              onClick={() => setExpanded((e) => !e)}
            >
              <ChevronUp className={`mx-auto h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>

          <SheetHeader className="px-4 pt-6">
            <SheetTitle className="text-lg font-semibold">Map Controls</SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="explore" className="mt-2 h-full">
            <div className="flex items-center justify-between px-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="explore">Explore</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="styles">Styles</TabsTrigger>
                <TabsTrigger value="legend">Legend</TabsTrigger>
              </TabsList>
            </div>

            {/* --- Explore (Presets) --- */}
            <TabsContent value="explore" className="h-[calc(100%-6rem)] overflow-y-auto px-4 pb-24 pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {presets.map((p) => (
                  <Card key={p.id} className="cursor-pointer transition hover:shadow-md" onClick={() => handlePresetApply(p.id)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Wand2 className="h-4 w-4" /> {p.name}
                      </CardTitle>
                    </CardHeader>
                    {p.description && (
                      <CardContent className="text-sm text-muted-foreground">{p.description}</CardContent>
                    )}
                  </Card>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
                <Button variant="outline" onClick={() => setExpanded((e)=>!e)}>{expanded ? "Shrink" : "Expand"}</Button>
              </div>
            </TabsContent>

            {/* --- Layers --- */}
            <TabsContent value="layers" className="h-[calc(100%-6rem)] overflow-y-auto px-4 pb-24 pt-4">
              <Input placeholder="Search layers..." className="mb-3" />
              {Object.entries(groupedLayers).map(([group, list]) => (
                <div key={group} className="mb-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{group}</div>
                  <div className="space-y-3">
                    {list.map((l) => (
                      <div key={l.id} className="rounded-xl border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {l.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            <div className="font-medium">{l.name}</div>
                          </div>
                          <Switch checked={l.visible} onCheckedChange={(v) => patchLayer(l.id, { visible: v })} />
                        </div>
                        <div className="mt-3 grid grid-cols-5 items-center gap-3">
                          <Label className="col-span-1 text-xs text-muted-foreground">Opacity</Label>
                          <div className="col-span-4">
                            <Slider value={[Math.round((l.opacity ?? 1) * 100)]}
                                    onValueChange={(v) => patchLayer(l.id, { opacity: (v[0] ?? 100) / 100 })} />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Labels</Label>
                          <Switch checked={l.labels} onCheckedChange={(v) => patchLayer(l.id, { labels: v })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-2 flex gap-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
                <Button variant="outline" onClick={() => setExpanded((e)=>!e)}>{expanded ? "Shrink" : "Expand"}</Button>
              </div>
            </TabsContent>

            {/* --- Filters --- */}
            <TabsContent value="filters" className="h-[calc(100%-6rem)] overflow-y-auto px-4 pb-28 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Find person or place... (type to search)" />
              </div>

              <Section title="People" subtitle="Who to include">
                <ChipBar
                  options={["direct","spouse","descendant"]}
                  values={filters.roles}
                  onToggle={(v) => toggleArrayKey("roles", v, filters, patchFilters)}
                />
              </Section>

              <Section title="Branches" subtitle="Family lines">
                <ChipBar
                  options={["maternal","paternal"]}
                  values={filters.branches}
                  onToggle={(v) => toggleArrayKey("branches", v, filters, patchFilters)}
                />
              </Section>

              <Section title="Place Type" subtitle="Where">
                <ChipBar
                  options={["country","state","county","city","cemetery"]}
                  values={filters.placeTypes}
                  onToggle={(v) => toggleArrayKey("placeTypes", v, filters, patchFilters)}
                />
              </Section>

              <Section title="Events" subtitle="What">
                <ChipBar
                  options={["birth","death","marriage","military","residence"]}
                  values={filters.events}
                  onToggle={(v) => toggleArrayKey("events", v, filters, patchFilters)}
                />
              </Section>

              <Section title="Timeline" subtitle="When (years)">
                <div className="mt-2">
                  <DoubleSlider
                    min={1600}
                    max={2025}
                    value={filters.timeRange}
                    onChange={(val) => patchFilters({ timeRange: val as [number, number] })}
                  />
                  <div className="mt-1 text-xs text-muted-foreground">{filters.timeRange[0]} — {filters.timeRange[1]}</div>
                </div>
              </Section>

              <div className="sticky bottom-2 mt-4 flex gap-2">
                <Button variant="outline" onClick={() => (onResetView ? onResetView() : undefined)}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset view
                </Button>
                <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
              </div>
            </TabsContent>

            {/* --- Styles --- */}
            <TabsContent value="styles" className="h-[calc(100%-6rem)] overflow-y-auto px-4 pb-24 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Fieldset title="Color by">
                  <SelectRow label="Era" active={styles.colorBy === "era"} onClick={() => patchStyles({ colorBy: "era" })} />
                  <SelectRow label="Branch" active={styles.colorBy === "branch"} onClick={() => patchStyles({ colorBy: "branch" })} />
                  <SelectRow label="Surname" active={styles.colorBy === "surname"} onClick={() => patchStyles({ colorBy: "surname" })} />
                  <SelectRow label="Event type" active={styles.colorBy === "eventType"} onClick={() => patchStyles({ colorBy: "eventType" })} />
                  <SelectRow label="None" active={styles.colorBy === "none"} onClick={() => patchStyles({ colorBy: "none" })} />
                </Fieldset>

                <Fieldset title="Arrow thickness by">
                  <SelectRow label="Distance" active={styles.thicknessBy === "distance"} onClick={() => patchStyles({ thicknessBy: "distance" })} />
                  <SelectRow label="Importance" active={styles.thicknessBy === "importance"} onClick={() => patchStyles({ thicknessBy: "importance" })} />
                  <SelectRow label="None" active={styles.thicknessBy === "none"} onClick={() => patchStyles({ thicknessBy: "none" })} />
                </Fieldset>

                <Fieldset title="Point shape">
                  <SelectRow label="Auto (by event)" active={styles.pointShape === "auto"} onClick={() => patchStyles({ pointShape: "auto" })} />
                  <SelectRow label="Simple" active={styles.pointShape === "simple"} onClick={() => patchStyles({ pointShape: "simple" })} />
                </Fieldset>

                <Fieldset title="Theme">
                  <SelectRow label="Auto" active={styles.theme === "auto"} onClick={() => patchStyles({ theme: "auto" })} />
                  <SelectRow label="Light" active={styles.theme === "light"} onClick={() => patchStyles({ theme: "light" })} />
                  <SelectRow label="Dark" active={styles.theme === "dark"} onClick={() => patchStyles({ theme: "dark" })} />
                  <SelectRow label="Colorblind-safe" active={styles.theme === "colorblind"} onClick={() => patchStyles({ theme: "colorblind" })} />
                </Fieldset>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => (onShareView ? onShareView() : undefined)}>
                  <Share2 className="mr-2 h-4 w-4" /> Share this view
                </Button>
                <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </TabsContent>

            {/* --- Legend --- */}
            <TabsContent value="legend" className="h-[calc(100%-6rem)] overflow-y-auto px-4 pb-16 pt-4">
              <p className="mb-3 text-sm text-muted-foreground">
                Context-aware legend shows only symbology for currently visible layers & styles.
                Tap a legend item to highlight matching features.
              </p>

              <div className="space-y-3">
                {legend.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => (onLegendKeyClick ? onLegendKeyClick(k.id) : undefined)}
                    className="flex w-full items-center justify-between rounded-xl border p-3 text-left hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div>{k.symbol}</div>
                      <div>
                        <div className="font-medium">{k.label}</div>
                        {typeof k.count === "number" && (
                          <div className="text-xs text-muted-foreground">{k.count} items</div>
                        )}
                      </div>
                    </div>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
                <Button variant="outline" onClick={() => setExpanded((e)=>!e)}>{expanded ? "Shrink" : "Expand"}</Button>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------------------- Small helpers ----------------------
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-sm font-medium">{title}</div>
      {subtitle && <div className="mb-2 text-xs text-muted-foreground">{subtitle}</div>}
      {children}
    </div>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-3">
      <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SelectRow({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border p-2 text-left transition ${active ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
    >
      <span>{label}</span>
      <div className={`h-3 w-3 rounded-full ${active ? "bg-primary" : "bg-muted"}`} />
    </button>
  );
}

function ChipBar({ options, values, onToggle }: { options: string[]; values: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={`rounded-full px-3 py-1 text-sm shadow-sm transition ${values.includes(opt) ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function toggleArrayKey<K extends keyof FiltersModel>(
  key: K,
  value: string,
  filters: FiltersModel,
  patch: (p: Partial<FiltersModel>) => void
) {
  const arr = new Set<string>(filters[key] as unknown as string[]);
  if (arr.has(value)) arr.delete(value); else arr.add(value);
  patch({ [key]: Array.from(arr) } as Partial<FiltersModel>);
}

// A simple double-ended slider (placeholder). Replace with a full-range slider as needed.
function DoubleSlider({ min, max, value, onChange }: { min: number; max: number; value: [number, number]; onChange: (val: [number, number]) => void }) {
  const [lo, hi] = value;
  function clamp(v: number) { return Math.min(Math.max(v, min), max); }
  return (
    <div>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={lo}
          min={min}
          max={hi}
          onChange={(e) => onChange([clamp(Number(e.target.value) || min), hi])}
          className="w-24"
        />
        <Separator orientation="vertical" className="h-6" />
        <Input
          type="number"
          value={hi}
          min={lo}
          max={max}
          onChange={(e) => onChange([lo, clamp(Number(e.target.value) || max)])}
          className="w-24"
        />
      </div>
      <div className="mt-2">
        <Slider
          min={min}
          max={max}
          step={1}
          value={[lo]}
          onValueChange={(v) => onChange([v[0] as number, hi])}
        />
        <Slider
          min={min}
          max={max}
          step={1}
          value={[hi]}
          onValueChange={(v) => onChange([lo, v[0] as number])}
        />
      </div>
    </div>
  );
}
