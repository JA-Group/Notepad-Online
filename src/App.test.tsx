import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value, onChange }: any) => (
      <textarea 
        data-testid="mock-monaco-editor" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    )
  };
});

describe('Notepad++ Online Editor (App)', () => {
  it('renders default UI elements properly', async () => {
    render(<App />);
    
    // Wait for session to load
    await waitFor(() => expect(screen.queryByText('Loading session...')).not.toBeInTheDocument());

    // Check Menu Bar
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    
    // Check Default File Name
    expect(screen.getAllByText(/Untitled\.txt/)[0]).toBeInTheDocument();
    
    // Check Default Status Bar
    expect(screen.getByText(/length:/)).toBeInTheDocument();
    expect(screen.getByText('plaintext type')).toBeInTheDocument();
  });

  it('handles New File action correctly', async () => {
    render(<App />);
    
    await waitFor(() => expect(screen.queryByText('Loading session...')).not.toBeInTheDocument());
    
    const newFileButtons = screen.getAllByTitle('New File');
    expect(newFileButtons.length).toBeGreaterThan(0);
    
    // Click the new file button in toolbar
    fireEvent.click(newFileButtons[0]);
    
    const untitledTabs = screen.getAllByText(/Untitled\.txt/);
    expect(untitledTabs.length).toBeGreaterThan(1);
  });

  it('updates file length on content change', async () => {
    render(<App />);
    
    await waitFor(() => expect(screen.queryByText('Loading session...')).not.toBeInTheDocument());

    const editor = screen.getByTestId('mock-monaco-editor');
    
    fireEvent.change(editor, { target: { value: 'Hello World' } });
    
    expect(screen.getByText('length: 11')).toBeInTheDocument();
  });
});
