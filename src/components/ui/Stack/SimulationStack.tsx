import React, { useEffect, useRef } from "react";
import "./SimulationStack.css";
import { Icon } from "../Icon/Icon";
import { FilterIcon } from "../Filter/FilterIcon";
import { SeveritySlider } from "../Filter/SeveritySlider";
import { RadiusSlider } from "../Filter/RadiusSlider";
import { FilterParameterSlider } from "../Filter/FilterParameterSlider";
import { FilterDropdown, FilterOption } from "../Filter/FilterDropdown";
import {
  CompleteFilterConfig,
  SimulationType,
} from "../../../utils/vision-simulator.types";
import { FILTER_METADATA } from "../../../utils/vision-simulator.constants";
import { describeFilterConfig } from "../../../utils/simulation-render";

/** One simulation in the Vision Lab stack */
export interface StackEntry {
  id: string;
  config: CompleteFilterConfig;
}

interface SimulationStackProps {
  entries: StackEntry[];
  /** The entry whose sliders are shown (only one at a time) */
  expandedId: string | null;
  onToggle: (id: string) => void;
  onChange: (id: string, config: CompleteFilterConfig) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onAdd: (filter: SimulationType) => void;
  /** Simulations that can be added (no "original") */
  addOptions: FilterOption[];
}

/**
 * Vision Lab's list of simulations, applied top to bottom.
 * Each entry shows a one-line summary; the expanded one shows its sliders.
 */
export const SimulationStack: React.FC<SimulationStackProps> = ({
  entries,
  expandedId,
  onToggle,
  onChange,
  onMove,
  onRemove,
  onAdd,
  addOptions,
}) => {
  // Keep keyboard focus in a sensible place when the list changes: React
  // re-renders the list after a move or removal and the focused button can
  // be lost. Where focus should go next is noted here and applied after.
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<
    | { kind: "button"; id: string; role: "up" | "down" | "toggle" }
    | { kind: "add" }
    | { kind: "last" }
    | null
  >(null);

  useEffect(() => {
    const target = pendingFocus.current;
    const root = rootRef.current;
    if (!target || !root) return;
    pendingFocus.current = null;
    let element: Element | null = null;
    if (target.kind === "add") {
      element = root.querySelector(".simulation-stack__add button");
    } else if (target.kind === "last") {
      const items = root.querySelectorAll('[data-role="toggle"]');
      element = items[items.length - 1] ?? null;
    } else {
      element = root.querySelector(
        `[data-entry-id="${target.id}"] [data-role="${target.role}"]`
      );
    }
    (element as HTMLElement | null)?.focus();
  }, [entries]);

  const moveEntry = (id: string, index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    let role: "up" | "down" = direction < 0 ? "up" : "down";
    // At the top the up button is disabled (and at the bottom, down)
    if (role === "up" && newIndex === 0) role = "down";
    if (role === "down" && newIndex === entries.length - 1) role = "up";
    if (entries.length === 2) role = direction < 0 ? "down" : "up";
    pendingFocus.current = { kind: "button", id, role };
    onMove(id, direction);
  };

  const removeEntry = (id: string, index: number) => {
    const neighbour = entries[index + 1] ?? entries[index - 1];
    pendingFocus.current = neighbour
      ? { kind: "button", id: neighbour.id, role: "toggle" }
      : { kind: "add" };
    onRemove(id);
  };

  return (
    <div className="simulation-stack" ref={rootRef}>
      {entries.length > 0 && (
        <ol className="simulation-stack__list" aria-label="Simulations, applied top to bottom">
          {entries.map((entry, index) => {
            const name = FILTER_METADATA[entry.config.type]?.name ?? entry.config.type;
            const expanded = entry.id === expandedId;
            return (
              <li
                key={entry.id}
                data-entry-id={entry.id}
                className={`simulation-stack__entry ${
                  expanded ? "simulation-stack__entry--expanded" : ""
                }`}
              >
                <div className="simulation-stack__header">
                  <button
                    className="simulation-stack__toggle"
                    data-role="toggle"
                    onClick={() => onToggle(entry.id)}
                    aria-expanded={expanded}
                    title={expanded ? "Hide settings" : "Show settings"}
                  >
                    <span className="simulation-stack__chevron" aria-hidden="true">
                      <Icon name={expanded ? "chevron-down" : "chevron-right"} size={12} />
                    </span>
                    <FilterIcon filterId={entry.config.type} size="tiny" decorative />
                    <span className="simulation-stack__name">{name}</span>
                    {!expanded && (
                      <span className="simulation-stack__summary">
                        {describeFilterConfig(entry.config)}
                      </span>
                    )}
                  </button>
                  <div className="simulation-stack__actions">
                    <button
                      className="simulation-stack__icon-btn"
                      data-role="up"
                      onClick={() => moveEntry(entry.id, index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${name} up`}
                      title="Move up (applied earlier)"
                    >
                      <Icon name="chevron-up" size={12} />
                    </button>
                    <button
                      className="simulation-stack__icon-btn"
                      data-role="down"
                      onClick={() => moveEntry(entry.id, index, 1)}
                      disabled={index === entries.length - 1}
                      aria-label={`Move ${name} down`}
                      title="Move down (applied later)"
                    >
                      <Icon name="chevron-down" size={12} />
                    </button>
                    <button
                      className="simulation-stack__icon-btn"
                      onClick={() => removeEntry(entry.id, index)}
                      aria-label={`Remove ${name}`}
                      title="Remove"
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="simulation-stack__settings">
                    <EntrySettings
                      config={entry.config}
                      onChange={(config) => onChange(entry.id, config)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <FilterDropdown
        className="simulation-stack__add"
        value="original"
        onChange={(value) => {
          if (value !== "original") {
            pendingFocus.current = { kind: "last" };
            onAdd(value);
          }
        }}
        options={addOptions}
        placeholder={entries.length === 0 ? "+ Add a simulation" : "+ Add another simulation"}
        showPlaceholder={true}
      />
    </div>
  );
};

/** Sliders for one simulation's settings (preset format v2 units) */
const EntrySettings: React.FC<{
  config: CompleteFilterConfig;
  onChange: (config: CompleteFilterConfig) => void;
}> = ({ config, onChange }) => {
  switch (config.type) {
    case "blurred":
      return (
        <>
          <FilterParameterSlider
            label="Blur radius"
            value={config.config.radius}
            onChange={(radius) => onChange({ ...config, config: { ...config.config, radius } })}
            min={0.5}
            max={15}
            step={0.5}
            unit="px"
            description="Blur strength, in design pixels"
          />
          <FilterParameterSlider
            label="Passes"
            value={config.config.iterations ?? 1}
            onChange={(iterations) => onChange({ ...config, config: { ...config.config, iterations } })}
            min={1}
            max={5}
            step={1}
            description="More passes give a smoother blur"
          />
        </>
      );
    case "ghosting": {
      const { offset } = config.config;
      return (
        <>
          <FilterParameterSlider
            label="Horizontal offset"
            value={offset.x}
            onChange={(x) => onChange({ ...config, config: { ...config.config, offset: { ...offset, x } } })}
            min={-15}
            max={15}
            step={0.5}
            unit="px"
            description="Ghost image shift, in design pixels"
          />
          <FilterParameterSlider
            label="Vertical offset"
            value={offset.y}
            onChange={(y) => onChange({ ...config, config: { ...config.config, offset: { ...offset, y } } })}
            min={-15}
            max={15}
            step={0.5}
            unit="px"
            description="Ghost image shift, in design pixels"
          />
          <FilterParameterSlider
            label="Ghost opacity"
            value={config.config.opacity}
            onChange={(opacity) => onChange({ ...config, config: { ...config.config, opacity } })}
            min={0}
            max={1}
            step={0.05}
            description="How visible the ghost image is"
          />
        </>
      );
    }
    case "yellowing":
      return (
        <>
          <FilterParameterSlider
            label="Intensity"
            value={config.config.intensity}
            onChange={(intensity) => onChange({ ...config, config: { ...config.config, intensity } })}
            min={0}
            max={1}
            step={0.05}
            description="Yellow tint strength"
          />
          <FilterParameterSlider
            label="Temperature"
            value={config.config.temperature}
            onChange={(temperature) => onChange({ ...config, config: { ...config.config, temperature } })}
            min={1000}
            max={4000}
            step={100}
            unit="K"
            description="Lower is warmer and yellower"
          />
        </>
      );
    case "loss-of-contrast":
      return (
        <FilterParameterSlider
          label="Contrast reduction"
          value={config.config.reduction}
          onChange={(reduction) => onChange({ ...config, config: { reduction } })}
          min={0}
          max={1}
          step={0.05}
          description="Higher means less contrast"
        />
      );
    case "bright-light":
      return (
        <>
          <FilterParameterSlider
            label="Brightness"
            value={config.config.intensity}
            onChange={(intensity) => onChange({ ...config, config: { ...config.config, intensity } })}
            min={0}
            max={1}
            step={0.05}
            description="Brightness increase"
          />
          <FilterParameterSlider
            label="Washout"
            value={config.config.washout}
            onChange={(washout) => onChange({ ...config, config: { ...config.config, washout } })}
            min={0}
            max={1}
            step={0.05}
            description="How much colors fade towards white"
          />
        </>
      );
    case "central-vision-loss":
    case "peripheral-vision-loss":
      return (
        <>
          <RadiusSlider
            value={Math.round(config.config.radiusPercent)}
            onChange={(radiusPercent) => onChange({ ...config, config: { ...config.config, radiusPercent } } as CompleteFilterConfig)}
            label={config.type === "central-vision-loss" ? "Affected area" : "Clear centre"}
            min={5}
            max={95}
            showValue={true}
            unit="%"
          />
          <SeveritySlider
            value={config.config.severity}
            onChange={(severity) => onChange({ ...config, config: { ...config.config, severity } } as CompleteFilterConfig)}
            label="Severity"
            showPercentage={true}
          />
        </>
      );
    default:
      // Color blindness
      return (
        <SeveritySlider
          value={(config as { severity?: number }).severity ?? 1}
          onChange={(severity) => onChange({ ...config, severity } as CompleteFilterConfig)}
          label="Severity"
          showPercentage={true}
        />
      );
  }
};
