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
import { FocusOrderPanel } from './features/annotation/focus-order/components/FocusOrderPanel';
import { HeadingsPanel } from './features/annotation/headings/components/HeadingsPanel';
import { LandmarksPanel } from './features/annotation/landmarks/components/LandmarksPanel';
import { NotesMainPanel } from './features/annotation/notes/components/NotesMainPanel';
import { PlatformNotesPanel } from './features/annotation/notes/components/PlatformNotesPanel';
import { PlatformType } from './features/annotation/notes/notes.types';

declare function require(path: string): any;

type View = 'main' | 'contrast' | 'touch-targets' | 'typography' | 'vision-simulator' | 'alt-text' | 'focus-order' | 'headings' | 'landmarks' | 'notes' | 'notes-platform';

function App() {
  const [currentView, setCurrentView] = React.useState<View>('main');
  const [selectedPlatform, setSelectedPlatform] = React.useState<PlatformType>('web');

  const handleToolSelect = (toolId: string) => {
    setCurrentView(toolId as View);
  };

  const handleBack = () => {
    setCurrentView('main');
  };

  const handleNotesBack = () => {
    setCurrentView('notes');
  };

  const handlePlatformSelect = (platform: PlatformType) => {
    setSelectedPlatform(platform);
    setCurrentView('notes-platform');
  };

  return (
    <main>
      {currentView === 'main' && <MainView onToolSelect={handleToolSelect} />}
      {currentView === 'contrast' && <ContrastPanel onBack={handleBack} />}
      {currentView === 'touch-targets' && <TouchTargetsPanel onBack={handleBack} />}
      {currentView === 'typography' && <TypographyPanel onBack={handleBack} />}
      {currentView === 'vision-simulator' && <VisionSimulatorPanel onBack={handleBack} />}
      {currentView === 'alt-text' && <AltTextPanel onBack={handleBack} />}
      {currentView === 'focus-order' && <FocusOrderPanel onBack={handleBack} />}
      {currentView === 'headings' && <HeadingsPanel onBack={handleBack} />}
      {currentView === 'landmarks' && <LandmarksPanel onBack={handleBack} />}
      {currentView === 'notes' && <NotesMainPanel onBack={handleBack} onPlatformSelect={handlePlatformSelect} />}
      {currentView === 'notes-platform' && <PlatformNotesPanel platform={selectedPlatform} onBack={handleNotesBack} />}

      {/* Footer section with credits and mode toggle */}
      <BottomSection />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('react-page')).render(<App />);
