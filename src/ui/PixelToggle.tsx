import styles from "@/ui/PixelToggle.module.css";

interface PixelToggleProps {
  label: string;
  on: boolean;
  onToggle: () => void;
}

export function PixelToggle({ label, on, onToggle }: PixelToggleProps) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <button
        type="button"
        className={styles.switch}
        data-on={on}
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        aria-label={label}
      >
        <span className={styles.knob} />
      </button>
    </div>
  );
}
