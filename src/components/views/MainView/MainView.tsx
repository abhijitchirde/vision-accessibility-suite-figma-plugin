import React from 'react';
import './MainView.css';
import { Card } from '../../ui/Card/Card';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'testing' | 'annotation';
  enabled: boolean;
}

const TOOLS: Tool[] = [
  // Testing Tools
  {
    id: 'contrast',
    name: 'Contrast',
    description: 'Check color contrast ratios',
    icon: 'contrast',
    category: 'testing',
    enabled: true,
  },
  {
    id: 'touch-targets',
    name: 'Touch Targets',
    description: 'Validate touch target sizes',
    icon: 'target',
    category: 'testing',
    enabled: true,
  },
  {
    id: 'typography',
    name: 'Typography',
    description: 'Validate font size, line height, and readability',
    icon: 'text',
    category: 'testing',
    enabled: true,
  },
  {
    id: 'vision-simulator',
    name: 'Vision Simulator',
    description: 'Simulate color blindness and visual impairments',
    icon: 'eye',
    category: 'testing',
    enabled: true,
  },
  // Annotation Tools
  {
    id: 'alt-text',
    name: 'Alt-Text',
    description: 'Add alternative text to images',
    icon: 'image',
    category: 'annotation',
    enabled: true,
  },
];

interface MainViewProps {
  onToolSelect: (toolId: string) => void;
}

export const MainView: React.FC<MainViewProps> = ({ onToolSelect }) => {
  const testingTools = TOOLS.filter((t) => t.category === 'testing' && t.enabled);
  const annotationTools = TOOLS.filter((t) => t.category === 'annotation' && t.enabled);

  return (
    <div className="main-view">
      {/* Testing Tools Section */}
      <section className="main-view__section">
        <h2 className="main-view__section-title">Testing tools</h2>
        <div className="main-view__tools">
          {testingTools.map((tool) => (
            <Card
              key={tool.id}
              icon={tool.icon}
              iconColor="var(--figma-color-text-brand)"
              title={tool.name}
              description={tool.description}
              onClick={() => onToolSelect(tool.id)}
            />
          ))}
        </div>
      </section>

      {/* Annotation Tools Section */}
      {annotationTools.length > 0 && (
        <section className="main-view__section">
          <h2 className="main-view__section-title">Annotation tools</h2>
          <div className="main-view__tools">
            {annotationTools.map((tool) => (
              <Card
                key={tool.id}
                icon={tool.icon}
                iconColor="var(--figma-color-text-brand)"
                title={tool.name}
                description={tool.description}
                onClick={() => onToolSelect(tool.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
