import { GameProvider } from '../components/GameProvider';
import CanvasMap from '../components/CanvasMap.tsx';
import HUD from '../components/HUD';
import Sidebar from '../components/Sidebar';
import MainMenu from '../components/MainMenu';
import Dashboard from '../components/Dashboard';
import DevModeOverlay from '../components/devMode/DevModeOverlay';

export default function Home() {
  console.log('%c[HOME RENDER]', 'background: purple; color: white; font-size: 20px');
  return (
    <GameProvider>
      <div id="game-root">
        <CanvasMap />
        <div id="hud">
          <HUD />
          <Sidebar />
          <Dashboard />
        </div>
        <DevModeOverlay />
        <MainMenu />
      </div>
    </GameProvider>
  );
}
