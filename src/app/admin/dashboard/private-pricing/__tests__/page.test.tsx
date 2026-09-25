import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Children } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PrivatePricingPage from '../page';

const { apiGet, apiPost, apiPatch, apiDelete } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({ default: { get: apiGet, post: apiPost, patch: apiPatch, delete: apiDelete } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => {
    const options = Children.toArray(children).flatMap((child: any) =>
      child?.props?.children ? Children.toArray(child.props.children) : []
    );
    return <select aria-label="Product" value={value} onChange={(event) => onValueChange(event.target.value)}>{options}</select>;
  },
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => children,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

describe('PrivatePricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockImplementation((path: string) => path === '/admin/users'
      ? Promise.resolve({ data: { data: { users: [{ id: 'u1', email: 'buyer@example.com', fullName: 'Buyer', phoneNumber: '08000000000' }] } } })
      : path === '/admin/reseller-api/private-prices'
        ? Promise.resolve({ data: { data: { items: [] } } })
        : Promise.resolve({ data: { data: { products: [{ id: 'p1', name: 'MTN 1GB', productCode: 'MTN-1GB', priceTags: { api: 450 } }] } } }));
    apiPost.mockResolvedValue({ data: { success: true } });
    apiPatch.mockResolvedValue({ data: { success: true } });
    apiDelete.mockResolvedValue({ data: { success: true } });
  });

  it('loads users/products and shows the current API price', async () => {
    render(<PrivatePricingPage />);
    fireEvent.change(screen.getByLabelText('Search by name, email, or phone'), { target: { value: 'buyer@example.com' } });
    expect(await screen.findByText(/buyer@example.com/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/buyer@example.com/));
    expect(await screen.findByText(/MTN-1GB/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Product'), { target: { value: 'p1' } });
    expect(screen.getByText('₦450')).toBeInTheDocument();
  });

  it('submits the selected user, product, amount, and reason', async () => {
    render(<PrivatePricingPage />);
    fireEvent.change(screen.getByLabelText('Search by name, email, or phone'), { target: { value: 'buyer@example.com' } });
    fireEvent.click(await screen.findByText(/buyer@example.com/));
    await screen.findByText(/MTN-1GB/);
    fireEvent.change(screen.getByLabelText('Product'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText('Private amount'), { target: { value: '275.50' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Enterprise agreement' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add private price' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/admin/reseller-api/private-prices', {
      userId: 'u1', operatorProductId: 'p1', amount: 275.5, reason: 'Enterprise agreement',
    }));
  });

  it('loads private prices for the selected user and supports editing', async () => {
    apiGet.mockImplementation((path: string) => path === '/admin/users'
      ? Promise.resolve({ data: { data: { users: [{ id: 'u1', email: 'buyer@example.com', fullName: 'Buyer' }] } } })
      : path === '/admin/reseller-api/private-prices'
        ? Promise.resolve({ data: { data: { items: [{ id: 'pp1', userId: 'u1', operatorProductId: 'p1', productName: 'MTN 1GB', productCode: 'MTN-1GB', amount: 275, reason: 'Old agreement', priceTags: { api: 450 } }] } } })
        : Promise.resolve({ data: { data: { products: [{ id: 'p1', name: 'MTN 1GB', productCode: 'MTN-1GB', priceTags: { api: 450 } }] } } }));
    render(<PrivatePricingPage />);
    fireEvent.change(screen.getByLabelText('Search by name, email, or phone'), { target: { value: 'buyer@example.com' } });
    fireEvent.click(await screen.findByText(/buyer@example.com/));
    expect(await screen.findByText(/Old agreement/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Edit MTN 1GB/i }));
    fireEvent.change(screen.getByLabelText('Private amount'), { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update private price' }));
    await waitFor(() => expect(apiPatch).toHaveBeenCalledWith('/admin/reseller-api/private-prices/pp1', { amount: 300, reason: 'Old agreement' }));
  });

  it('does not submit a negative amount or missing reason', async () => {
    render(<PrivatePricingPage />);
    fireEvent.change(screen.getByLabelText('Search by name, email, or phone'), { target: { value: 'buyer@example.com' } });
    fireEvent.click(await screen.findByText(/buyer@example.com/));
    await screen.findByText(/MTN-1GB/);
    fireEvent.change(screen.getByLabelText('Product'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText('Private amount'), { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add private price' }));
    expect(apiPost).not.toHaveBeenCalled();
  });
});
