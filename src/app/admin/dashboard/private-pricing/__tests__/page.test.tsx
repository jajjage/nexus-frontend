import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PrivatePricingPage from '../page';

const apiGet = vi.fn();
const apiPost = vi.fn();

vi.mock('@/lib/api-client', () => ({ default: { get: apiGet, post: apiPost } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => <div data-value={value} onChange={(event: any) => onValueChange(event.target.value)}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

describe('PrivatePricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockImplementation((path: string) => path === '/admin/users'
      ? Promise.resolve({ data: { data: { users: [{ id: 'u1', email: 'buyer@example.com', fullName: 'Buyer', phoneNumber: '08000000000' }] } } })
      : Promise.resolve({ data: { data: { products: [{ id: 'p1', name: 'MTN 1GB', productCode: 'MTN-1GB', priceTags: { api: 450 } }] } } }));
    apiPost.mockResolvedValue({ data: { success: true } });
  });

  it('loads users/products and shows the current API price', async () => {
    render(<PrivatePricingPage />);
    fireEvent.change(screen.getByLabelText('User'), { target: { value: 'buyer@example.com' } });
    expect(await screen.findByText(/buyer@example.com/)).toBeInTheDocument();
    expect(await screen.findByText(/MTN-1GB/)).toBeInTheDocument();
    expect(screen.getByText('₦450')).toBeInTheDocument();
  });

  it('submits the selected user, product, amount, and reason', async () => {
    render(<PrivatePricingPage />);
    await screen.findByText(/MTN-1GB/);
    fireEvent.change(screen.getByLabelText('User'), { target: { value: 'buyer@example.com' } });
    fireEvent.click(await screen.findByText(/buyer@example.com/));
    fireEvent.change(screen.getByText(/Choose a product/).parentElement!, { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText('Private amount'), { target: { value: '275.50' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Enterprise agreement' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set private price' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/admin/reseller-api/private-prices', {
      userId: 'u1', operatorProductId: 'p1', amount: 275.5, reason: 'Enterprise agreement',
    }));
  });

  it('does not submit a negative amount or missing reason', async () => {
    render(<PrivatePricingPage />);
    await screen.findByText(/MTN-1GB/);
    fireEvent.change(screen.getByLabelText('User'), { target: { value: 'buyer@example.com' } });
    fireEvent.change(screen.getByLabelText('Private amount'), { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set private price' }));
    expect(apiPost).not.toHaveBeenCalled();
  });
});
