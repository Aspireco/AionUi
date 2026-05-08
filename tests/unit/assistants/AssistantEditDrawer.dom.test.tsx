import React from 'react';
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for AssistantEditDrawer component (A7 in N4a).
 * Tests drawer rendering, form fields, save/cancel handlers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from '@arco-design/web-react';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

vi.mock('@/renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: false }),
}));

import AssistantEditDrawer from '@/renderer/pages/settings/AssistantSettings/AssistantEditDrawer';

const renderWithProviders = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('AssistantEditDrawer', () => {
  const defaultProps = {
    visible: false,
    onClose: vi.fn(),
    editName: '',
    setEditName: vi.fn(),
    editDescription: '',
    setEditDescription: vi.fn(),
    editContext: '',
    setEditContext: vi.fn(),
    editAvatar: '',
    setEditAvatar: vi.fn(),
    editAgent: 'claude',
    setEditAgent: vi.fn(),
    editSkills: '',
    setEditSkills: vi.fn(),
    availableBackends: [],
    onSave: vi.fn(),
    isCreating: false,
    isExtensionAssistant: false,
    promptViewMode: 'preview' as const,
    setPromptViewMode: vi.fn(),
    localeKey: 'en',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render when visible=false', () => {
    renderWithProviders(<AssistantEditDrawer {...defaultProps} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders drawer when visible=true', () => {
    renderWithProviders(<AssistantEditDrawer {...defaultProps} visible={true} />);
    expect(screen.getByRole('dialog') || screen.getByText(/name/i)).toBeInTheDocument();
  });

  it('renders form fields with current values', () => {
    renderWithProviders(<AssistantEditDrawer {...defaultProps} visible={true} editName="TestAssistant" />);
    const nameInput = screen.getByDisplayValue('TestAssistant');
    expect(nameInput).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    const onSaveSpy = vi.fn();
    renderWithProviders(<AssistantEditDrawer {...defaultProps} visible={true} onSave={onSaveSpy} editName="Test" />);

    const saveButton = screen.getByRole('button', { name: /save/i }) || screen.getAllByRole('button')[0];
    const user = userEvent.setup();
    await user.click(saveButton);

    expect(onSaveSpy).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const onCloseSpy = vi.fn();
    renderWithProviders(<AssistantEditDrawer {...defaultProps} visible={true} onClose={onCloseSpy} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i }) || screen.getAllByRole('button')[1];
    const user = userEvent.setup();
    await user.click(cancelButton);

    expect(onCloseSpy).toHaveBeenCalled();
  });

  it('disables name field for extension assistants', () => {
    renderWithProviders(<AssistantEditDrawer {...defaultProps} visible={true} isExtensionAssistant={true} editName="Ext" />);
    const nameInput = screen.getByDisplayValue('Ext');
    expect(nameInput).toBeDisabled();
  });
});
