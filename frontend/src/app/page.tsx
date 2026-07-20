import { GameProvider } from '../components/GameProvider';
import CanvasMap from '../components/CanvasMap';
import HUD from '../components/HUD';
import Sidebar from '../components/Sidebar';
import MainMenu from '../components/MainMenu';
import Dashboard from '../components/Dashboard';

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
        <MainMenu />
      </div>
    </GameProvider>
  );
}
