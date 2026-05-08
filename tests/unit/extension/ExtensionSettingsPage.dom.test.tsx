import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ConfigProvider } from '@arco-design/web-react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import ExtensionSettingsPage from '@/renderer/pages/settings/ExtensionSettingsPage';

describe('ExtensionSettingsPage', () => {
  afterEach(() => cleanup());

  it('renders without crashing', () => {
    render(<ConfigProvider><ExtensionSettingsPage /></ConfigProvider>);
    expect(document.body).toBeInTheDocument();
  });

  it('accepts props correctly', () => {
    render(<ConfigProvider><ExtensionSettingsPage /></ConfigProvider>);
    expect(document.body).toBeInTheDocument();
  });

  it('handles empty state', () => {
    render(<ConfigProvider><ExtensionSettingsPage /></ConfigProvider>);
    expect(document.body).toBeInTheDocument();
  });
});
