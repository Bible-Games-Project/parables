import { ScreenShell } from "@/screens/ScreenShell";
import { ParableRow } from "@/screens/parablesMenu/ParableRow";
import { PARABLES } from "@/parables/registry";
import { useT } from "@/locales/useT";
import { useAppStore } from "@/store/appStore";
import { useProgressStore } from "@/store/progressStore";
import { useSettingsStore } from "@/store/settingsStore";
import styles from "@/screens/parablesMenu/ParablesMenuScreen.module.css";

/** The player's permanent Book of Parables — every parable ever added appears here, grayscale and locked until its encounter is completed in Israel, then full color, starred and replayable forever after. Reached from inside Israel; always hands back to Israel, never to Home. */
export function ParablesMenuScreen() {
  const t = useT();
  const navigate = useAppStore((state) => state.navigate);
  const openParable = useAppStore((state) => state.openParable);
  const completedIds = useProgressStore((state) => state.completedParableIds);
  const stars = useProgressStore((state) => state.stars);
  const debugMode = useSettingsStore((state) => state.debugMode);

  return (
    <ScreenShell title={t("parablesMenu.title")} onBack={() => navigate("israel")}>
      <div className={styles.list}>
        {PARABLES.map((parable) => (
          <ParableRow
            key={parable.id}
            parable={parable}
            completed={completedIds.includes(parable.id)}
            stars={stars[parable.id] ?? 0}
            onSelect={openParable}
            debugUnlocked={debugMode}
          />
        ))}
      </div>
    </ScreenShell>
  );
}
