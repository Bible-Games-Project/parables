import { useCallback, useState } from "react";
import type { Application } from "pixi.js";
import { PixiStage } from "@/engine/PixiStage";
import { createHomeBackground } from "@/screens/home/backgroundScene";
import { PixelButton } from "@/ui/PixelButton";
import { PixelIconButton } from "@/ui/PixelIconButton";
import { gearIcon, globeIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import { useAppStore } from "@/store/appStore";
import { SettingsModal } from "@/screens/SettingsModal";
import { LanguageModal } from "@/screens/LanguageModal";
import styles from "@/screens/home/HomeScreen.module.css";

export function HomeScreen() {
  const t = useT();
  const navigate = useAppStore((state) => state.navigate);
  const settingsOpen = useAppStore((state) => state.settingsOpen);
  const languageOpen = useAppStore((state) => state.languageOpen);
  const openSettings = useAppStore((state) => state.openSettings);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const openLanguage = useAppStore((state) => state.openLanguage);
  const closeLanguage = useAppStore((state) => state.closeLanguage);

  const [ready, setReady] = useState(false);

  const onReady = useCallback((app: Application) => {
    setReady(true);
    return createHomeBackground(app);
  }, []);

  return (
    <div className={styles.screen}>
      <PixiStage className={styles.stage} onReady={onReady} />

      {ready && (
        <div className={styles.overlay}>
          <PixelIconButton
            sprite={globeIcon}
            seed="language"
            className={[styles.cornerButton, styles.langButton].join(" ")}
            onClick={openLanguage}
            aria-label={t("language.title")}
          />
          <PixelIconButton
            sprite={gearIcon}
            seed="settings"
            className={[styles.cornerButton, styles.settingsButton].join(" ")}
            onClick={openSettings}
            aria-label={t("settings.title")}
          />

          <h1 className={styles.title}>{t("home.title")}</h1>

          <div className={styles.menu}>
            <PixelButton size="large" onClick={() => navigate("parablesMenu")}>
              {t("home.play")}
            </PixelButton>
            <PixelButton size="large" onClick={() => navigate("moreGames")}>
              {t("home.moreGames")}
            </PixelButton>
            <PixelButton size="large" onClick={() => navigate("premium")}>
              {t("home.premium")}
            </PixelButton>
          </div>
        </div>
      )}

      {settingsOpen && <SettingsModal onClose={closeSettings} />}
      {languageOpen && <LanguageModal onClose={closeLanguage} />}
    </div>
  );
}
