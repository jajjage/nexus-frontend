import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '@/components/login-form';

describe('LoginForm', () => {
  it('renders the login form with all elements', () => {
    render(<LoginForm />);
    
    // Check title - it's a div, not a heading, so use getByText
    expect(screen.getByText('Login', { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
    expect(screen.getByText(/enter your email below/i)).toBeInTheDocument();
    
    // Check form inputs
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    
    // Check buttons with exact names
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login with Google' })).toBeInTheDocument();
    
    // Check links
    expect(screen.getByRole('link', { name: /forgot your password/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('has email input with correct attributes', () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'm@example.com');
    expect(emailInput).toBeRequired();
  });

  it('has password input with correct attributes', () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toBeRequired();
  });
});