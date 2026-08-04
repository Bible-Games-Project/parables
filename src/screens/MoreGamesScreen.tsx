import { ScreenShell } from "@/screens/ScreenShell";
import { PlaceholderCard } from "@/screens/PlaceholderCard";
import { useT } from "@/locales/useT";
import { useAppStore } from "@/store/appStore";
import styles from "@/screens/PlaceholderCard.module.css";

export function MoreGamesScreen() {
  const t = useT();
  const navigate = useAppStore((state) => state.navigate);

  return (
    <ScreenShell title={t("moreGames.title")} onBack={() => navigate("home")}>
      <div className={styles.grid}>
        <PlaceholderCard seed="more-games-1" />
        <PlaceholderCard seed="more-games-2" />
        <PlaceholderCard seed="more-games-3" />
      </div>
    </ScreenShell>
  );
}
