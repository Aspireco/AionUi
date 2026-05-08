import React from 'react';
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for SkillConfirmModals component (A10 in N4a).
 * Tests multiple confirmation modals for pending/custom skill actions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from '@arco-design/web-react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

import SkillConfirmModals from '@/renderer/pages/settings/AssistantSettings/SkillConfirmModals';

const renderWithProviders = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('SkillConfirmModals', () => {
  const defaultProps = {
    deletePendingSkillName: null as string | null,
    setDeletePendingSkillName: vi.fn(),
    deleteCustomSkillName: null as string | null,
    setDeleteCustomSkillName: vi.fn(),
    onConfirmDeletePendingSkill: vi.fn(),
    onConfirmDeleteCustomSkill: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders pending skill delete modal when deletePendingSkillName is set', () => {
    renderWithProviders(<SkillConfirmModals {...defaultProps} deletePendingSkillName="skill-x" />);
    expect(screen.getByText(/skill-x|delete|pending/i)).toBeInTheDocument();
  });

  it('does not render pending skill modal when deletePendingSkillName is null', () => {
    renderWithProviders(<SkillConfirmModals {...defaultProps} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onConfirmDeletePendingSkill when confirmed', async () => {
    const onConfirmSpy = vi.fn();
    renderWithProviders(<SkillConfirmModals {...defaultProps} deletePendingSkillName="skill-x" onConfirmDeletePendingSkill={onConfirmSpy} />);

    const confirmButton = screen.getByRole('button', { name: /confirm|delete|ok/i }) || screen.getAllByRole('button')[0];
    const user = userEvent.setup();
    await user.click(confirmButton);

    expect(onConfirmSpy).toHaveBeenCalled();
  });

  it('renders custom skill delete modal when deleteCustomSkillName is set', () => {
    renderWithProviders(<SkillConfirmModals {...defaultProps} deleteCustomSkillName="custom-skill" />);
    expect(screen.getByText(/custom-skill|delete/i)).toBeInTheDocument();
  });

  it('calls onConfirmDeleteCustomSkill when confirmed', async () => {
    const onConfirmSpy = vi.fn();
    renderWithProviders(<SkillConfirmModals {...defaultProps} deleteCustomSkillName="custom-skill" onConfirmDeleteCustomSkill={onConfirmSpy} />);

    const confirmButton = screen.getByRole('button', { name: /confirm|delete|ok/i }) || screen.getAllByRole('button')[0];
    const user = userEvent.setup();
    await user.click(confirmButton);

    expect(onConfirmSpy).toHaveBeenCalled();
  });

  it('closes modal when cancel is clicked', async () => {
    const setDeletePendingSpy = vi.fn();
    renderWithProviders(<SkillConfirmModals {...defaultProps} deletePendingSkillName="skill-x" setDeletePendingSkillName={setDeletePendingSpy} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i }) || screen.getAllByRole('button')[1];
    const user = userEvent.setup();
    await user.click(cancelButton);

    expect(setDeletePendingSpy).toHaveBeenCalledWith(null);
  });
});
