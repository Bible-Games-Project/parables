import { useAppStore } from "@/store/appStore";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { MoreGamesScreen } from "@/screens/MoreGamesScreen";
import { PremiumScreen } from "@/screens/PremiumScreen";
import { ParablesMenuScreen } from "@/screens/parablesMenu/ParablesMenuScreen";
import { ParableScreen } from "@/screens/ParableScreen";
import { IsraelScreen } from "@/world/IsraelScreen";

export default function App() {
  const screen = useAppStore((state) => state.screen);

  switch (screen) {
    case "home":
      return <HomeScreen />;
    case "moreGames":
      return <MoreGamesScreen />;
    case "premium":
      return <PremiumScreen />;
    case "israel":
      return <IsraelScreen />;
    case "parablesMenu":
      return <ParablesMenuScreen />;
    case "parable":
      return <ParableScreen />;
    default:
      return <HomeScreen />;
  }
}
