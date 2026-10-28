import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FamilyMemberForm } from '../../src/features/family/components/FamilyMemberForm';
import type { FamilyMember } from '../../src/features/family/types';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { setSetting } from '../../src/storage/db';

/**
 * Permanent regression suite for the Family Civil ID/Passport expiry
 * correction's form UI (Section 2 of the spec): both fields must be
 * present, correctly labeled in Arabic/English, optional, and their values
 * flow through to `onSubmit` untouched.
 */
describe('FamilyMemberForm: Civil ID / Passport expiry fields', () => {
  it('renders the Arabic labels for both new expiry fields', async () => {
    await setSetting('locale', 'ar');
    render(
      <LanguageProvider>
        <FamilyMemberForm onSubmit={async () => {}} onCancel={() => {}} />
      </LanguageProvider>,
    );
    expect(await screen.findByLabelText('تاريخ انتهاء البطاقة المدنية')).toBeInTheDocument();
    expect(screen.getByLabelText('تاريخ انتهاء جواز السفر')).toBeInTheDocument();
  });

  it('renders the English labels for both new expiry fields', async () => {
    await setSetting('locale', 'en');
    render(
      <LanguageProvider>
        <FamilyMemberForm onSubmit={async () => {}} onCancel={() => {}} />
      </LanguageProvider>,
    );
    expect(await screen.findByLabelText('Civil ID Expiry Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Passport Expiry Date')).toBeInTheDocument();
  });

  it('both fields are optional -- submitting with neither filled in succeeds', async () => {
    await setSetting('locale', 'en');
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <LanguageProvider>
        <FamilyMemberForm onSubmit={onSubmit} onCancel={() => {}} />
      </LanguageProvider>,
    );
    fireEvent.change(await screen.findByLabelText('Full Name'), { target: { value: 'Sara' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ civilIdExpiryDate: undefined, passportExpiryDate: undefined });
  });

  it('entered expiry dates flow through to onSubmit unchanged', async () => {
    await setSetting('locale', 'en');
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <LanguageProvider>
        <FamilyMemberForm onSubmit={onSubmit} onCancel={() => {}} />
      </LanguageProvider>,
    );
    fireEvent.change(await screen.findByLabelText('Full Name'), { target: { value: 'Sara' } });
    fireEvent.change(screen.getByLabelText('Civil ID Expiry Date'), { target: { value: '2027-06-15' } });
    fireEvent.change(screen.getByLabelText('Passport Expiry Date'), { target: { value: '2027-12-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ civilIdExpiryDate: '2027-06-15', passportExpiryDate: '2027-12-15' });
  });

  it('an existing member editing the form is pre-filled with their stored expiry dates', async () => {
    await setSetting('locale', 'en');
    const member: FamilyMember = {
      id: 'fm1',
      fullName: 'Sara',
      civilIdExpiryDate: '2027-06-15',
      passportExpiryDate: '2027-12-15',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    render(
      <LanguageProvider>
        <FamilyMemberForm initialValue={member} onSubmit={async () => {}} onCancel={() => {}} />
      </LanguageProvider>,
    );
    expect(await screen.findByLabelText('Civil ID Expiry Date')).toHaveValue('2027-06-15');
    expect(screen.getByLabelText('Passport Expiry Date')).toHaveValue('2027-12-15');
  });
});
