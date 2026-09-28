import { render, screen, fireEvent } from '@testing-library/react';
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
  it('renders default UI elements properly', () => {
    render(<App />);
    
    // Check Menu Bar
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    
    // Check Default File Name
    expect(screen.getByText('Untitled.txt')).toBeInTheDocument();
    
    // Check Default Status Bar
    expect(screen.getByText(/length:/)).toBeInTheDocument();
    expect(screen.getByText('plaintext type')).toBeInTheDocument();
  });

  it('handles New File action correctly', () => {
    render(<App />);
    
    const newFileButtons = screen.getAllByTitle('New File');
    expect(newFileButtons.length).toBeGreaterThan(0);
    
    // Click the new file button in toolbar
    fireEvent.click(newFileButtons[0]);
    
    expect(screen.getByText('Untitled.txt')).toBeInTheDocument();
    expect(screen.getByText('plaintext type')).toBeInTheDocument();
  });

  it('updates file length on content change', () => {
    render(<App />);
    const editor = screen.getByTestId('mock-monaco-editor');
    
    fireEvent.change(editor, { target: { value: 'Hello World' } });
    
    expect(screen.getByText('length: 11')).toBeInTheDocument();
  });
});
