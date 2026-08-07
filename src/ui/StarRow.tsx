import { PixelIcon } from "@/ui/PixelIcon";
import { starIcon } from "@/pixel-art/icons";
import styles from "@/ui/StarRow.module.css";

interface StarRowProps {
  stars: number;
  max?: number;
  size?: number;
  className?: string;
}

/** A row of the shared gold star icon, dimmed to grayscale for the unearned ones — the one star display used everywhere (victory screens, the Parables Book). */
export function StarRow({ stars, max = 3, size = 18, className }: StarRowProps) {
  return (
    <div className={[styles.row, className ?? ""].join(" ").trim()}>
      {Array.from({ length: max }).map((_, index) => (
        <PixelIcon key={index} sprite={starIcon} size={size} className={index < stars ? undefined : styles.empty} />
      ))}
    </div>
  );
}
