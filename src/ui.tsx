import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './ui.css';
import BottomSection from './components/ui/BottomSection';
import { MainView } from './components/views/MainView/MainView';
import { ContrastPanel } from './features/testing/contrast/components/ContrastPanel';
import { TouchTargetsPanel } from './features/testing/touch-targets/components/TouchTargetsPanel';

declare function require(path: string): any;

type View = 'main' | 'contrast' | 'touch-targets';

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

      {/* Footer section with credits and mode toggle */}
      <BottomSection />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('react-page')).render(<App />);
