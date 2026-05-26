import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('axios', () => ({
  create: () => ({
    post: jest.fn(),
    get: jest.fn(),
  }),
}));

test('renders LiveLink landing page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'LiveLink' })).toBeInTheDocument();
});
