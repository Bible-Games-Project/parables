import { PixelPanel } from "@/ui/PixelPanel";
import { PixelIcon } from "@/ui/PixelIcon";
import { starIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import styles from "@/screens/PlaceholderCard.module.css";

interface PlaceholderCardProps {
  seed: string;
}

export function PlaceholderCard({ seed }: PlaceholderCardProps) {
  const t = useT();
  return (
    <PixelPanel seed={seed} className={styles.card}>
      <PixelIcon sprite={starIcon} size={36} />
      <span className={styles.label}>{t("moreGames.comingSoon")}</span>
    </PixelPanel>
  );
}
