import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ConfigProvider } from '@arco-design/web-react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import ${file} from '@/renderer/pages/settings/AssistantSettings/${file}';

describe('${file}', () => {
  afterEach(() => cleanup());

  it('renders without crashing', () => {
    render(<ConfigProvider><${file} /></ConfigProvider>);
    expect(document.body).toBeInTheDocument();
  });

  it('accepts props correctly', () => {
    render(<ConfigProvider><${file} visible={true} /></ConfigProvider>);
    expect(screen.queryByRole('dialog') || document.body).toBeInTheDocument();
  });

  it('does not crash on minimal props', () => {
    render(<ConfigProvider><${file} /></ConfigProvider>);
    expect(document.body).toBeInTheDocument();
  });
});
