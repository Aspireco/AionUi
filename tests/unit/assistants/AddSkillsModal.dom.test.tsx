import React from 'react';
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for AddSkillsModal component (A9 in N4a).
 * Tests skill list display, search filtering, selection, and batch add.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from '@arco-design/web-react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

import AddSkillsModal from '@/renderer/pages/settings/AssistantSettings/AddSkillsModal';
import type { SkillInfo } from '@/renderer/pages/settings/AssistantSettings/types';

const renderWithProviders = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('AddSkillsModal', () => {
  const mockSkills: SkillInfo[] = [
    { name: 'skill-a', path: '/a', description: 'Skill A' },
    { name: 'skill-b', path: '/b', description: 'Skill B' },
  ];

  const defaultProps = {
    visible: false,
    onClose: vi.fn(),
    onAddSkills: vi.fn(),
    availableSkills: mockSkills,
    selectedSkills: [],
    setSelectedSkills: vi.fn(),
    externalSources: [],
    activeSourceTab: '',
    setActiveSourceTab: vi.fn(),
    searchExternalQuery: '',
    setSearchExternalQuery: vi.fn(),
    externalSkillsLoading: false,
    handleRefreshExternal: vi.fn(),
    showAddPathModal: false,
    setShowAddPathModal: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render when visible=false', () => {
    renderWithProviders(<AddSkillsModal {...defaultProps} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with skill list when visible=true', () => {
    renderWithProviders(<AddSkillsModal {...defaultProps} visible={true} />);
    expect(screen.getByText(/skill-a|skill-b/i)).toBeInTheDocument();
  });

  it('displays empty state when no skills available', () => {
    renderWithProviders(<AddSkillsModal {...defaultProps} visible={true} availableSkills={[]} />);
    expect(screen.queryByText('skill-a')).not.toBeInTheDocument();
  });

  it('calls onAddSkills when add button is clicked', async () => {
    const onAddSkillsSpy = vi.fn();
    renderWithProviders(<AddSkillsModal {...defaultProps} visible={true} onAddSkills={onAddSkillsSpy} selectedSkills={['skill-a']} />);

    const addButton = screen.getByRole('button', { name: /add/i }) || screen.getAllByRole('button')[0];
    const user = userEvent.setup();
    await user.click(addButton);

    expect(onAddSkillsSpy).toHaveBeenCalled();
  });

  it('allows searching and filtering skills', async () => {
    const setSearchSpy = vi.fn();
    renderWithProviders(<AddSkillsModal {...defaultProps} visible={true} setSearchExternalQuery={setSearchSpy} />);

    const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('textbox');
    const user = userEvent.setup();
    await user.type(searchInput, 'skill-a');

    expect(setSearchSpy).toHaveBeenCalled();
  });

  it('displays loading state when externalSkillsLoading=true', () => {
    renderWithProviders(<AddSkillsModal {...defaultProps} visible={true} externalSkillsLoading={true} />);
    expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
