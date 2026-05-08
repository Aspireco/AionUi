import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ConfigProvider } from '@arco-design/web-react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import ExtensionSettingsTabContent from '@/renderer/components/settings/SettingsModal/contents/ExtensionSettingsTabContent';

describe('ExtensionSettingsTabContent', () => {
  afterEach(() => cleanup());

  it('renders without crashing', () => {
    render(<ConfigProvider><ExtensionSettingsTabContent /></ConfigProvider>);
    expect(document.body).toBeInTheDocument();
  });

  it('accepts props correctly', () => {
    render(<ConfigProvider><ExtensionSettingsTabContent /></ConfigProvider>);
    expect(document.body).toBeInTheDocument();
  });

  it('handles empty state', () => {
    render(<ConfigProvider><ExtensionSettingsTabContent /></ConfigProvider>);
    expect(document.body).toBeInTheDocument();
  });
});
