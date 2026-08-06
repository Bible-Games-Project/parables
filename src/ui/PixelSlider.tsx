import styles from "@/ui/PixelSlider.module.css";

interface PixelSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function PixelSlider({ label, value, onChange, disabled }: PixelSliderProps) {
  return (
    <label className={styles.row} data-disabled={disabled}>
      <span className={styles.label}>{label}</span>
      <input
        type="range"
        className={styles.track}
        min={0}
        max={100}
        value={Math.round(value * 100)}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
    </label>
  );
}
