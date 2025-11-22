import React, { useState, useEffect } from 'react';
import './ContrastPanel.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { useFigmaMessage } from '../../../../hooks/useFigmaMessage';
import { ContrastResult } from '../contrast.types';

export const ContrastPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [result, setResult] = useState<ContrastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendMessage } = useFigmaMessage();

  // Listen for messages from plugin code
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === 'CONTRAST_RESULT') {
        setLoading(false);
        if (msg.success) {
          setResult(msg.data);
          setError(null);
        } else {
          setError(msg.error || 'Failed to check contrast');
          setResult(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial check
    requestCheck();

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const requestCheck = () => {
    setLoading(true);
    setError(null);
    sendMessage('CHECK_CONTRAST_SELECTION');
  };

  if (loading && !result) {
    return (
      <div className="contrast-panel">
        <div className="contrast-panel__header">
          <Button variant="ghost" size="small" onClick={onBack}>
            <Icon name="chevron-left" size={20} />
          </Button>
          <h2>Contrast</h2>
        </div>
        <div className="contrast-panel__loading">
          <p>Checking contrast...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="contrast-panel">
        <div className="contrast-panel__header">
          <Button variant="ghost" size="small" onClick={onBack}>
            <Icon name="chevron-left" size={20} />
          </Button>
          <h2>Contrast</h2>
        </div>
        <div className="contrast-panel__empty">
          <p>{error || 'Select a text layer to check contrast'}</p>
          <Button variant="secondary" onClick={requestCheck}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // WCAG thresholds
  const normalAA = 4.5;
  const normalAAA = 7.0;
  const largeAA = 3.0;
  const largeAAA = 4.5;

  const passNormalAA = result.ratio >= normalAA;
  const passNormalAAA = result.ratio >= normalAAA;
  const passLargeAA = result.ratio >= largeAA;
  const passLargeAAA = result.ratio >= largeAAA;

  return (
    <div className="contrast-panel">
      <div className="contrast-panel__header">
        <Button variant="ghost" size="small" onClick={onBack}>
          <Icon name="chevron-left" size={20} />
        </Button>
        <h2>Contrast</h2>
      </div>

      <div className="contrast-panel__content">
        {/* Color swatches */}
        <div className="color-swatches">
          <div className="color-swatch-container">
            <div
              className="color-swatch"
              style={{ backgroundColor: result.foregroundHex }}
            >
              <div className="color-swatch__edit">
                <Icon name="contrast" size={16} color="white" />
              </div>
            </div>
            <div className="color-hex">{result.foregroundHex}</div>
          </div>
          <div className="color-swatch-container">
            <div
              className="color-swatch"
              style={{ backgroundColor: result.backgroundHex }}
            >
              <div className="color-swatch__edit">
                <Icon name="contrast" size={16} color="#666" />
              </div>
            </div>
            <div className="color-hex">{result.backgroundHex}</div>
          </div>
        </div>

        {/* Contrast ratio display */}
        <div className="contrast-ratio">
          <div className="contrast-ratio__value">
            {result.ratio.toFixed(1)}:1
          </div>
          <div className="contrast-ratio__label">Simple Contrast (WCAG)</div>
        </div>

        {/* WCAG compliance sections */}
        <div className="wcag-sections">
          {/* Normal Text */}
          <div className="wcag-section">
            <div className="wcag-section__title">Normal Text</div>
            <div className="wcag-checks">
              <div className={`wcag-check ${passNormalAA ? 'pass' : 'fail'}`}>
                {passNormalAA ? (
                  <Icon name="check" size={16} color="#10b981" />
                ) : (
                  <Icon name="close" size={16} color="#ef4444" />
                )}
                <span className="wcag-check__level">AA</span>
                <span className="wcag-check__ratio">{normalAA}:1</span>
              </div>
              <div className={`wcag-check ${passNormalAAA ? 'pass' : 'fail'}`}>
                {passNormalAAA ? (
                  <Icon name="check" size={16} color="#10b981" />
                ) : (
                  <Icon name="close" size={16} color="#ef4444" />
                )}
                <span className="wcag-check__level">AAA</span>
                <span className="wcag-check__ratio">{normalAAA}:1</span>
              </div>
            </div>
          </div>

          {/* Large Text */}
          <div className="wcag-section">
            <div className="wcag-section__title">Large Text</div>
            <div className="wcag-checks">
              <div className={`wcag-check ${passLargeAA ? 'pass' : 'fail'}`}>
                {passLargeAA ? (
                  <Icon name="check" size={16} color="#10b981" />
                ) : (
                  <Icon name="close" size={16} color="#ef4444" />
                )}
                <span className="wcag-check__level">AA</span>
                <span className="wcag-check__ratio">{largeAA}:1</span>
              </div>
              <div className={`wcag-check ${passLargeAAA ? 'pass' : 'fail'}`}>
                {passLargeAAA ? (
                  <Icon name="check" size={16} color="#10b981" />
                ) : (
                  <Icon name="close" size={16} color="#ef4444" />
                )}
                <span className="wcag-check__level">AAA</span>
                <span className="wcag-check__ratio">{largeAAA}:1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Node info */}
        <div className="node-info">
          <div className="node-info__item">
            <span className="node-info__label">Layer:</span>
            <span className="node-info__value">{result.nodeName}</span>
          </div>
          {result.fontSize && (
            <div className="node-info__item">
              <span className="node-info__label">Font size:</span>
              <span className="node-info__value">{result.fontSize.toFixed(0)}px</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
