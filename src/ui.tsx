import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './ui.css';
import BottomSection from './components/ui/BottomSection';
import { MainView } from './components/views/MainView/MainView';
import { ContrastPanel } from './features/testing/contrast/components/ContrastPanel';
import { TouchTargetsPanel } from './features/testing/touch-targets/components/TouchTargetsPanel';
import { TypographyPanel } from './features/testing/typography/components/TypographyPanel';
import { VisionSimulatorPanel } from './features/testing/vision-simulator/components/VisionSimulatorPanel';
import { AltTextPanel } from './features/annotation/alt-text/components/AltTextPanel';

declare function require(path: string): any;

type View = 'main' | 'contrast' | 'touch-targets' | 'typography' | 'vision-simulator' | 'alt-text';

function App() {
  const [currentView, setCurrentView] = React.useState<View>('main');

  const handleToolSelect = (toolId: string) => {
    setCurrentView(toolId as View);
  };

  const handleBack = () => {
    setCurrentView('main');
  };

  return (
    <main>
      {currentView === 'main' && <MainView onToolSelect={handleToolSelect} />}
      {currentView === 'contrast' && <ContrastPanel onBack={handleBack} />}
      {currentView === 'touch-targets' && <TouchTargetsPanel onBack={handleBack} />}
      {currentView === 'typography' && <TypographyPanel onBack={handleBack} />}
      {currentView === 'vision-simulator' && <VisionSimulatorPanel onBack={handleBack} />}
      {currentView === 'alt-text' && <AltTextPanel onBack={handleBack} />}

      {/* Footer section with credits and mode toggle */}
      <BottomSection />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('react-page')).render(<App />);
