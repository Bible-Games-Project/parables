import { HealthBar } from "@/ui/HealthBar";
import { heartIcon, sheepIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import type { LostSheepMissionState } from "@/parables/lost-sheep/missionState";
import styles from "@/parables/lost-sheep/LostSheepHud.module.css";

interface LostSheepHudProps {
  shepherdHp: number;
  sheepHp: number;
  state: LostSheepMissionState;
}

export function LostSheepHud({ shepherdHp, sheepHp, state }: LostSheepHudProps) {
  const t = useT();
  const objectiveKey = state === "escort" ? "lostSheep.objective.escort" : "lostSheep.objective.search";

  return (
    <div className={styles.hud}>
      <div className={styles.bars}>
        <HealthBar icon={heartIcon} current={shepherdHp} max={100} />
        <HealthBar icon={sheepIcon} current={sheepHp} max={100} />
      </div>
      {(state === "search" || state === "escort") && <div className={styles.objective}>{t(objectiveKey)}</div>}
    </div>
  );
}
