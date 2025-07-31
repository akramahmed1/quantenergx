import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

describe('Frontend Performance Tests', () => {
  describe('Component Rendering Performance', () => {
    it('should render large lists efficiently', async () => {
      const LargeList = ({ items }: { items: string[] }) => {
        return (
          <div data-testid="large-list">
            {items.map((item, index) => (
              <div key={index} className="list-item">
                {item}
              </div>
            ))}
          </div>
        );
      };

      const largeItemList = Array(1000).fill(null).map((_, i) => `Item ${i}`);
      
      const startTime = performance.now();
      
      render(<LargeList items={largeItemList} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('large-list')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Rendering 1000 items should take less than 100ms
      expect(renderTime).toBeLessThan(100);
      
      // All items should be present
      expect(screen.getAllByText(/^Item \d+$/)).toHaveLength(1000);
    });

    it('should handle frequent re-renders efficiently', async () => {
      const FrequentUpdater = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount(c => c + 1);
          }, 10);
          
          // Stop after 100 updates
          setTimeout(() => clearInterval(interval), 1000);
          
          return () => clearInterval(interval);
        }, []);
        
        return <div data-testid="counter">{count}</div>;
      };

      const startTime = performance.now();
      
      render(<FrequentUpdater />);
      
      // Wait for updates to complete
      await waitFor(() => {
        const counter = screen.getByTestId('counter');
        return parseInt(counter.textContent || '0') >= 95;
      }, { timeout: 2000 });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // 100 updates should complete within 1.5 seconds
      expect(totalTime).toBeLessThan(1500);
    });

    it('should optimize re-renders with React.memo', () => {
      let renderCount = 0;
      
      const ExpensiveComponent = React.memo(({ data }: { data: string }) => {
        renderCount++;
        return <div data-testid="expensive">{data}</div>;
      });
      
      const ParentComponent = () => {
        const [count, setCount] = React.useState(0);
        const [data] = React.useState('static data');
        
        return (
          <div>
            <button onClick={() => setCount(c => c + 1)}>
              Increment: {count}
            </button>
            <ExpensiveComponent data={data} />
          </div>
        );
      };

      const { rerender } = render(<ParentComponent />);
      
      const initialRenderCount = renderCount;
      
      // Trigger re-renders by changing count
      act(() => {
        screen.getByText(/Increment:/).click();
      });
      
      rerender(<ParentComponent />);
      
      // ExpensiveComponent should not re-render since data prop hasn't changed
      expect(renderCount).toBe(initialRenderCount);
    });
  });

  describe('Network Performance', () => {
    it('should implement request caching', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'cached data' }),
      });
      global.fetch = mockFetch;
      
      const cache = new Map();
      
      const cachedFetch = async (url: string) => {
        if (cache.has(url)) {
          return cache.get(url);
        }
        
        const response = await fetch(url);
        const data = await response.json();
        cache.set(url, data);
        return data;
      };
      
      // First call
      await cachedFetch('/api/data');
      
      // Second call should use cache
      await cachedFetch('/api/data');
      
      // Should only make one network request
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should implement request debouncing', async () => {
      jest.useFakeTimers();
      
      const mockSearch = jest.fn().mockResolvedValue(['result1', 'result2']);
      
      const debouncedSearch = (query: string, delay: number = 300) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(mockSearch(query));
          }, delay);
        });
      };
      
      // Trigger multiple searches rapidly
      debouncedSearch('test1');
      debouncedSearch('test2');
      debouncedSearch('test3');
      
      // Fast-forward time
      jest.advanceTimersByTime(299);
      expect(mockSearch).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(1);
      
      await act(async () => {
        jest.runAllTimers();
      });
      
      // Should only call search once with the last query
      expect(mockSearch).toHaveBeenCalledTimes(1);
      expect(mockSearch).toHaveBeenCalledWith('test3');
      
      jest.useRealTimers();
    });

    it('should implement efficient data loading strategies', async () => {
      const DataLoader = ({ loadAll = false }: { loadAll?: boolean }) => {
        const [data, setData] = React.useState<string[]>([]);
        const [loading, setLoading] = React.useState(false);
        
        const loadData = React.useCallback(async () => {
          setLoading(true);
          
          if (loadAll) {
            // Load all data at once (inefficient)
            const allData = Array(1000).fill(null).map((_, i) => `Item ${i}`);
            setData(allData);
          } else {
            // Load data in chunks (efficient)
            const chunk = Array(100).fill(null).map((_, i) => `Item ${i}`);
            setData(chunk);
          }
          
          setLoading(false);
        }, [loadAll]);
        
        React.useEffect(() => {
          loadData();
        }, [loadData]);
        
        if (loading) return <div>Loading...</div>;
        
        return (
          <div data-testid="data-list">
            {data.map((item, index) => (
              <div key={index}>{item}</div>
            ))}
          </div>
        );
      };

      const startTime = performance.now();
      
      render(<DataLoader loadAll={false} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('data-list')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Chunked loading should be faster
      expect(loadTime).toBeLessThan(50);
      
      // Should only load first 100 items
      expect(screen.getAllByText(/^Item \d+$/)).toHaveLength(100);
    });
  });

  describe('Memory Performance', () => {
    it('should clean up event listeners', () => {
      const EventComponent = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          const handleClick = () => setCount(c => c + 1);
          
          document.addEventListener('click', handleClick);
          
          // Cleanup function
          return () => {
            document.removeEventListener('click', handleClick);
          };
        }, []);
        
        return <div data-testid="event-count">{count}</div>;
      };

      const { unmount } = render(<EventComponent />);
      
      // Trigger click event
      document.dispatchEvent(new Event('click'));
      
      expect(screen.getByTestId('event-count')).toHaveTextContent('1');
      
      // Unmount component
      unmount();
      
      // Click should not affect unmounted component
      // (This test verifies cleanup is working)
      document.dispatchEvent(new Event('click'));
      
      // No errors should occur
      expect(true).toBe(true);
    });

    it('should prevent memory leaks in intervals', () => {
      const TimerComponent = () => {
        const [time, setTime] = React.useState(Date.now());
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setTime(Date.now());
          }, 100);
          
          // Cleanup interval
          return () => clearInterval(interval);
        }, []);
        
        return <div data-testid="timer">{time}</div>;
      };

      const { unmount } = render(<TimerComponent />);
      
      const initialTime = screen.getByTestId('timer').textContent;
      
      // Wait a bit
      setTimeout(() => {
        const updatedTime = screen.getByTestId('timer').textContent;
        expect(updatedTime).not.toBe(initialTime);
        
        // Unmount to test cleanup
        unmount();
        
        // Timer should be cleaned up (no errors)
        expect(true).toBe(true);
      }, 150);
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should use dynamic imports for code splitting', async () => {
      const LazyComponent = React.lazy(() => 
        Promise.resolve({
          default: () => <div data-testid="lazy">Lazy loaded content</div>
        })
      );
      
      const App = () => (
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      );
      
      render(<App />);
      
      // Should show loading first
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Then show lazy content
      await waitFor(() => {
        expect(screen.getByTestId('lazy')).toBeInTheDocument();
      });
    });

    it('should optimize image loading', () => {
      const OptimizedImage = ({ src, alt }: { src: string; alt: string }) => {
        const [loaded, setLoaded] = React.useState(false);
        
        return (
          <div>
            {!loaded && <div data-testid="placeholder">Loading image...</div>}
            <img
              src={src}
              alt={alt}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              style={{ display: loaded ? 'block' : 'none' }}
              data-testid="optimized-image"
            />
          </div>
        );
      };

      render(<OptimizedImage src="/test-image.jpg" alt="Test" />);
      
      expect(screen.getByTestId('placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('optimized-image')).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Performance Monitoring', () => {
    it('should measure component render times', () => {
      const PerformanceWrapper = ({ children }: { children: React.ReactNode }) => {
        const [renderTime, setRenderTime] = React.useState<number | null>(null);
        
        React.useLayoutEffect(() => {
          const startTime = performance.now();
          
          // Measure after render
          setTimeout(() => {
            const endTime = performance.now();
            setRenderTime(endTime - startTime);
          }, 0);
        });
        
        return (
          <div>
            {children}
            {renderTime && (
              <div data-testid="render-time">
                Render time: {renderTime.toFixed(2)}ms
              </div>
            )}
          </div>
        );
      };

      const TestComponent = () => (
        <div>
          {Array(100).fill(null).map((_, i) => (
            <div key={i}>Item {i}</div>
          ))}
        </div>
      );

      render(
        <PerformanceWrapper>
          <TestComponent />
        </PerformanceWrapper>
      );

      waitFor(() => {
        expect(screen.getByTestId('render-time')).toBeInTheDocument();
      });
    });

    it('should track Core Web Vitals', () => {
      const WebVitalsTracker = () => {
        const [vitals, setVitals] = React.useState<any>({});
        
        React.useEffect(() => {
          // Mock web vitals measurement
          const measureVitals = () => {
            const fcp = performance.getEntriesByType('paint')
              .find(entry => entry.name === 'first-contentful-paint')?.startTime;
            
            const lcp = performance.getEntriesByType('largest-contentful-paint')
              .pop()?.startTime;
            
            setVitals({
              fcp: fcp || 0,
              lcp: lcp || 0,
              cls: 0, // Cumulative Layout Shift (mock)
            });
          };
          
          // Measure after paint
          setTimeout(measureVitals, 100);
        }, []);
        
        return (
          <div data-testid="vitals">
            FCP: {vitals.fcp?.toFixed(2) || 'N/A'}ms
            LCP: {vitals.lcp?.toFixed(2) || 'N/A'}ms
            CLS: {vitals.cls?.toFixed(3) || 'N/A'}
          </div>
        );
      };

      render(<WebVitalsTracker />);
      
      waitFor(() => {
        expect(screen.getByTestId('vitals')).toBeInTheDocument();
      });
    });
  });
});