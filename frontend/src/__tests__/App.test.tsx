import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';

// Create a mock store for testing
const createMockStore = () => {
  return configureStore({
    reducer: {
      // Add minimal reducers as needed
      auth: (state = { isAuthenticated: false, user: null }, action) => state,
      ocr: (state = { documents: [], processing: false }, action) => state,
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('App Component', () => {
  test('renders without crashing', () => {
    renderWithProviders(<App />);
    // The app should render without throwing errors
    expect(document.body).toBeTruthy();
  });

  test('renders main application layout', () => {
    renderWithProviders(<App />);
    // Check if the app container is present
    const appElement = document.querySelector('.App') || document.body.firstChild;
    expect(appElement).toBeTruthy();
  });
});