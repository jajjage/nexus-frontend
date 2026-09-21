import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateSupplierForm } from '../CreateSupplierForm';

const mutate = vi.fn();
vi.mock('@/hooks/admin/useAdminSuppliers', () => ({
  useAdminSuppliers: () => ({ data: { data: { suppliers: [{ id: 'adex-parent', name: 'ADEX', supplierKind: 'parent', protocolFamilyId: 'adex_v1' }] } } }),
  useCreateSupplier: () => ({ mutate }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => <div data-value={value} onChange={(event: any) => onValueChange(event.target.value)}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

describe('CreateSupplierForm parent selection', () => {
  it('shows ADEX and keeps standalone creation available', () => {
    render(<CreateSupplierForm />);
    expect(screen.getByText(/ADEX · adex_v1/)).toBeInTheDocument();
    expect(screen.getByText('Standalone legacy supplier')).toBeInTheDocument();
  });

  it('submits a selected ADEX parent', () => {
    render(<CreateSupplierForm />);
    fireEvent.change(screen.getByText(/Standalone legacy supplier/).parentElement!, { target: { value: 'adex-parent' } });
    fireEvent.change(screen.getByLabelText('Supplier Name'), { target: { value: 'ADEX Client' } });
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'adex-client' } });
    fireEvent.change(screen.getByLabelText('API Base URL'), { target: { value: 'https://client.example/api' } });
    fireEvent.change(screen.getByLabelText('API Key'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /create supplier/i }));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ parentSupplierId: 'adex-parent', supplierKind: 'child' }), expect.anything());
  });
});
