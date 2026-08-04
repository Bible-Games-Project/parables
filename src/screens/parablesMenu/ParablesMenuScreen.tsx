import { ScreenShell } from "@/screens/ScreenShell";
import { ParableRow } from "@/screens/parablesMenu/ParableRow";
import { PARABLES } from "@/parables/registry";
import { useT } from "@/locales/useT";
import { useAppStore } from "@/store/appStore";
import { useProgressStore } from "@/store/progressStore";
import styles from "@/screens/parablesMenu/ParablesMenuScreen.module.css";

export function ParablesMenuScreen() {
  const t = useT();
  const navigate = useAppStore((state) => state.navigate);
  const openParable = useAppStore((state) => state.openParable);
  const unlockedIds = useProgressStore((state) => state.unlockedParableIds);
  const completedIds = useProgressStore((state) => state.completedParableIds);

  return (
    <ScreenShell title={t("parablesMenu.title")} onBack={() => navigate("home")}>
      <div className={styles.list}>
        {PARABLES.map((parable) => (
          <ParableRow
            key={parable.id}
            parable={parable}
            unlocked={unlockedIds.includes(parable.id)}
            completed={completedIds.includes(parable.id)}
            onSelect={openParable}
          />
        ))}
      </div>
    </ScreenShell>
  );
}
