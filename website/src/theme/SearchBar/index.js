import React, {useState, useEffect, useCallback} from 'react';
import Head from '@docusaurus/Head';
import {useHistory} from '@docusaurus/router';
import {usePluginData} from '@docusaurus/useGlobalData';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useThemeConfig} from '@docusaurus/theme-common';

/**
 * Command Palette Search Bar
 * 
 * A keyboard-first search experience with Cmd+K support.
 * Features: fuzzy search, keyboard navigation, recent searches.
 */
export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const history = useHistory();
  const {siteConfig} = useDocusaurusContext();
  
  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vcomm-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);
  
  // Save recent searches
  const saveRecentSearch = useCallback((term) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('vcomm-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);
  
  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      
      // Keyboard navigation within results
      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const selected = results[selectedIndex];
          if (selected) {
            navigateToResult(selected);
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);
  
  // Search functionality
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    // Use the local search index
    const searchIndex = window.__VCOMM_SEARCH_INDEX__ || [];
    const lowerQuery = query.toLowerCase();
    
    const filtered = searchIndex.filter(item => 
      item.title?.toLowerCase().includes(lowerQuery) ||
      item.content?.toLowerCase().includes(lowerQuery) ||
      item.section?.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
    
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);
  
  const navigateToResult = (result) => {
    saveRecentSearch(query);
    setIsOpen(false);
    setQuery('');
    history.push(result.path);
  };
  
  const shortcuts = [
    { keys: ['⌘', 'K'], description: 'Open command palette' },
    { keys: ['↑', '↓'], description: 'Navigate results' },
    { keys: ['Enter'], description: 'Select result' },
    { keys: ['Esc'], description: 'Close palette' },
  ];
  
  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="command-palette-trigger"
        aria-label="Open search"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <span className="command-palette-shortcut">⌘K</span>
      </button>
      
      {/* Command Palette Modal */}
      {isOpen && (
        <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
          <div className="command-palette-modal" onClick={e => e.stopPropagation()}>
            {/* Search Input */}
            <div className="command-palette-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="command-palette-input"
                placeholder="Search documentation..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              <button 
                className="command-palette-esc"
                onClick={() => setIsOpen(false)}
              >
                ESC
              </button>
            </div>
            
            {/* Results */}
            <div className="command-palette-results">
              {results.length > 0 ? (
                results.map((result, index) => (
                  <div
                    key={result.path}
                    className={`command-palette-result ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="result-icon">📄</div>
                    <div className="result-content">
                      <div className="result-title">{result.title}</div>
                      {result.section && (
                        <div className="result-section">{result.section}</div>
                      )}
                    </div>
                    <div className="result-arrow">→</div>
                  </div>
                ))
              ) : query ? (
                <div className="command-palette-empty">
                  No results found for "<strong>{query}</strong>"
                </div>
              ) : (
                <>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="command-palette-section">
                      <div className="section-title">Recent Searches</div>
                      {recentSearches.map((term, index) => (
                        <div
                          key={term}
                          className={`command-palette-result ${index === selectedIndex ? 'selected' : ''}`}
                          onClick={() => setQuery(term)}
                        >
                          <div className="result-icon">🕐</div>
                          <div className="result-content">{term}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Quick Actions */}
                  <div className="command-palette-section">
                    <div className="section-title">Quick Actions</div>
                    <div className="command-palette-result" onClick={() => history.push('/docs/getting-started')}>
                      <div className="result-icon">🚀</div>
                      <div className="result-content">Getting Started</div>
                    </div>
                    <div className="command-palette-result" onClick={() => history.push('/docs/api')}>
                      <div className="result-icon">📚</div>
                      <div className="result-content">API Reference</div>
                    </div>
                    <div className="command-palette-result" onClick={() => history.push('/docs/security')}>
                      <div className="result-icon">🔐</div>
                      <div className="result-content">Security Guide</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Footer */}
            <div className="command-palette-footer">
              {shortcuts.map(({keys, description}) => (
                <div key={description} className="shortcut">
                  {keys.map((key, i) => (
                    <span key={i}>
                      <kbd>{key}</kbd>
                      {i < keys.length - 1 && ' '}
                    </span>
                  ))}
                  <span>{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}