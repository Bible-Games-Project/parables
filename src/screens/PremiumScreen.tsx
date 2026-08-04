import { ScreenShell } from "@/screens/ScreenShell";
import { PixelPanel } from "@/ui/PixelPanel";
import { PixelIcon } from "@/ui/PixelIcon";
import { starIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import { useAppStore } from "@/store/appStore";
import styles from "@/screens/PremiumScreen.module.css";

export function PremiumScreen() {
  const t = useT();
  const navigate = useAppStore((state) => state.navigate);

  return (
    <ScreenShell title={t("premium.title")} onBack={() => navigate("home")}>
      <PixelPanel seed="premium" className={styles.panel}>
        <PixelIcon sprite={starIcon} size={48} />
        <span>{t("premium.comingSoon")}</span>
        <p className={styles.subtitle}>{t("premium.subtitle")}</p>
      </PixelPanel>
    </ScreenShell>
  );
}
