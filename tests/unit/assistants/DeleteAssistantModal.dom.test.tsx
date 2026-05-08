import React from 'react';
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for DeleteAssistantModal component (A8 in N4a).
 * Tests deletion confirmation modal, builtin guard, and cancel behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from '@arco-design/web-react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

import DeleteAssistantModal from '@/renderer/pages/settings/AssistantSettings/DeleteAssistantModal';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';

const renderWithProviders = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('DeleteAssistantModal', () => {
  const defaultProps = {
    visible: false,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    activeAssistant: null as AssistantListItem | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render when visible=false', () => {
    renderWithProviders(<DeleteAssistantModal {...defaultProps} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal when visible=true', () => {
    const assistant: AssistantListItem = { id: 'a1', name: 'Test', sort_order: 1, source: 'user', enabled: true };
    renderWithProviders(<DeleteAssistantModal {...defaultProps} visible={true} activeAssistant={assistant} />);
    expect(screen.getByText(/delete/i)).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked for user assistant', async () => {
    const onConfirmSpy = vi.fn();
    const assistant: AssistantListItem = { id: 'a1', name: 'UserAssistant', sort_order: 1, source: 'user', enabled: true };
    renderWithProviders(<DeleteAssistantModal {...defaultProps} visible={true} activeAssistant={assistant} onConfirm={onConfirmSpy} />);

    const confirmButton = screen.getByRole('button', { name: /confirm|delete|ok/i }) || screen.getAllByRole('button')[0];
    const user = userEvent.setup();
    await user.click(confirmButton);

    expect(onConfirmSpy).toHaveBeenCalled();
  });

  it('disables confirm button for builtin assistant', () => {
    const assistant: AssistantListItem = { id: 'claude', name: 'Claude', sort_order: 1, source: 'builtin', enabled: true };
    renderWithProviders(<DeleteAssistantModal {...defaultProps} visible={true} activeAssistant={assistant} />);

    const confirmButton = screen.getByRole('button', { name: /confirm|delete|ok/i }) || screen.getAllByRole('button')[0];
    expect(confirmButton).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancelSpy = vi.fn();
    const assistant: AssistantListItem = { id: 'a1', name: 'Test', sort_order: 1, source: 'user', enabled: true };
    renderWithProviders(<DeleteAssistantModal {...defaultProps} visible={true} activeAssistant={assistant} onCancel={onCancelSpy} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i }) || screen.getAllByRole('button')[1];
    const user = userEvent.setup();
    await user.click(cancelButton);

    expect(onCancelSpy).toHaveBeenCalled();
  });

  it('shows warning message for builtin assistant', () => {
    const assistant: AssistantListItem = { id: 'claude', name: 'Claude', sort_order: 1, source: 'builtin', enabled: true };
    renderWithProviders(<DeleteAssistantModal {...defaultProps} visible={true} activeAssistant={assistant} />);

    expect(screen.getByText(/builtin|cannot|delete/i)).toBeInTheDocument();
  });
});
