import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

it('increments the counter', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText(/counter: 1/i)).toBeInTheDocument();
});