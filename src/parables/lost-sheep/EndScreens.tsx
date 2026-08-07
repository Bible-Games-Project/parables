import { PixelPanel } from "@/ui/PixelPanel";
import { PixelButton } from "@/ui/PixelButton";
import { PixelIcon } from "@/ui/PixelIcon";
import { StarRow } from "@/ui/StarRow";
import { sheepIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import styles from "@/parables/lost-sheep/EndScreens.module.css";

export function GameOverOverlay({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div className={[styles.overlay, styles.gameOver].join(" ")}>
      <PixelPanel seed="game-over" className={styles.panel}>
        <span className={styles.title}>{t("lostSheep.gameOver.title")}</span>
        <PixelButton onClick={onRetry}>{t("lostSheep.gameOver.retry")}</PixelButton>
      </PixelPanel>
    </div>
  );
}

export function VictoryOverlay({ onContinue, stars }: { onContinue: () => void; stars: number }) {
  const t = useT();
  return (
    <div className={[styles.overlay, styles.victory].join(" ")}>
      <div className={styles.panel}>
        <PixelIcon sprite={sheepIcon} size={72} />
        <span className={styles.title}>{t("lostSheep.victory.title")}</span>
        <StarRow stars={stars} size={26} />
        <p className={styles.verse}>{t("lostSheep.victory.verse")}</p>
        <PixelButton onClick={onContinue}>{t("lostSheep.victory.continue")}</PixelButton>
      </div>
    </div>
  );
}
