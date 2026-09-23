import { fireEvent, render, screen } from '@testing-library/react';
import { Children } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CreateSupplierForm } from '../CreateSupplierForm';

const mutate = vi.fn();
vi.mock('@/hooks/admin/useAdminSuppliers', () => ({
  useAdminSuppliers: () => ({ data: { data: { suppliers: [{ id: 'adex-parent', name: 'ADEX', supplierKind: 'parent', protocolFamilyId: 'adex_v1' }] } } }),
  useCreateSupplier: () => ({ mutate }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => {
    const options = Children.toArray(children).flatMap((child: any) =>
      child?.props?.children ? Children.toArray(child.props.children) : []
    );
    return <select value={value} onChange={(event) => onValueChange(event.target.value)}>{options}</select>;
  },
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => children,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

describe('CreateSupplierForm parent selection', () => {
  it('shows ADEX and keeps standalone creation available', () => {
    render(<CreateSupplierForm />);
    expect(screen.getByText(/ADEX · adex_v1/)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('submits a selected ADEX parent', () => {
    render(<CreateSupplierForm />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'adex-parent' } });
    fireEvent.change(screen.getByLabelText('Supplier Name'), { target: { value: 'ADEX Client' } });
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'adex-client' } });
    fireEvent.change(screen.getByLabelText('API Base URL'), { target: { value: 'https://client.example/api' } });
    fireEvent.change(screen.getByLabelText('API Key'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /create supplier/i }));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ parentSupplierId: 'adex-parent', supplierKind: 'child' }), expect.anything());
  });
});
