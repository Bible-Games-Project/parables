import styles from "@/ui/PixelSlider.module.css";

interface PixelSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function PixelSlider({ label, value, onChange }: PixelSliderProps) {
  return (
    <label className={styles.row}>
      <span className={styles.label}>{label}</span>
      <input
        type="range"
        className={styles.track}
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
    </label>
  );
}
