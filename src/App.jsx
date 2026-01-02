import { useState, useEffect } from 'react';
import * as Diff from 'diff';
import TextInputSection from './components/TextInputSection';
import ComparisonSection from './components/ComparisonSection';
import PermalinkButton from './components/PermalinkButton';
import { parseText, getKeys, getConfigValue } from './utils/parser';
import { matchLines } from './utils/lineMatcher';
import './App.css';

function App() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [parsedText1, setParsedText1] = useState({});
  const [parsedText2, setParsedText2] = useState({});
  const [keys1, setKeys1] = useState([]);
  const [keys2, setKeys2] = useState([]);
  const [selectedKey1, setSelectedKey1] = useState('');
  const [selectedKey2, setSelectedKey2] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [permalinkUrl, setPermalinkUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load permalink on initialization
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const permalinkId = urlParams.get('permalink');

    if (permalinkId) {
      loadPermalink(permalinkId);
    }
  }, []);

  const loadPermalink = async (id) => {
    try {
      const response = await fetch(`/api/load-permalink?id=${id}`);
      const result = await response.json();

      if (result.success) {
        setText1(result.text1 || '');
        setText2(result.text2 || '');
      }
      // On failure, do nothing - text1/text2 remain as default empty strings
    } catch (error) {
      // Silent failure, no error display
      console.error('Load permalink error:', error);
    }
  };

  const handleGeneratePermalink = async () => {
    setIsGenerating(true);
    setPermalinkUrl(null);

    try {
      const response = await fetch('/api/save-permalink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text1, text2 }),
      });

      const result = await response.json();

      if (result.success) {
        setPermalinkUrl(result.url);
      } else {
        // Display storage full or other errors
        alert(result.error || 'Failed to generate permalink. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    const parsed1 = parseText(text1);
    const parsed2 = parseText(text2);
    setParsedText1(parsed1);
    setParsedText2(parsed2);
    setKeys1(getKeys(parsed1));                                        
    setKeys2(getKeys(parsed2));   
    setSubmitted(true);
    setSelectedKey1('');
    setSelectedKey2('');
    setDiffResult(null);
  };

  useEffect(() => {
    if (selectedKey1 && selectedKey2) {
      const config1 = getConfigValue(parsedText1, selectedKey1).replace(/\]/g, ']\n');
      const config2 = getConfigValue(parsedText2, selectedKey2).replace(/\]/g, ']\n');

      // Use diffLines to get optimal differences (Myers algorithm)
      const diff = Diff.diffLines(config1, config2);

      const processedDiff = [];

      // Process diff using a simple for loop to handle modified pairs
      for (let i = 0; i < diff.length; i++) {
        const part = diff[i];

        if (!part.added && !part.removed) {
          // Unchanged lines
          const lines = part.value.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            processedDiff.push({ type: 'unchanged', line });
          });
        } else if (part.removed && i + 1 < diff.length && diff[i + 1].added) {
          // Modified: pair removed + added blocks using intelligent matching
          const removedLines = part.value.split('\n').filter(line => line.trim());
          const addedLines = diff[i + 1].value.split('\n').filter(line => line.trim());

          // Use intelligent line matching
          const matchedResults = matchLines(removedLines, addedLines);
          processedDiff.push(...matchedResults);

          i++; // Skip next added part since we already processed it
        } else if (part.removed) {
          // Pure removal
          const lines = part.value.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            processedDiff.push({ type: 'removed', line });
          });
        } else if (part.added) {
          // Pure addition
          const lines = part.value.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            processedDiff.push({ type: 'added', line });
          });
        }
      }

      setDiffResult(processedDiff);
    } else {
      setDiffResult(null);
    }
  }, [selectedKey1, selectedKey2, parsedText1, parsedText2]);

  return (
    <div className="App">
      <div className="app-header">
        <h1>Web Prod Config Diff</h1>
        <PermalinkButton
          onGenerate={handleGeneratePermalink}
          isGenerating={isGenerating}
          permalinkUrl={permalinkUrl}
        />
      </div>
      <TextInputSection
        text1={text1}
        text2={text2}
        onText1Change={setText1}
        onText2Change={setText2}
        onSubmit={handleSubmit}
      />
      {submitted && (
        <ComparisonSection
          keys1={keys1}
          keys2={keys2}
          selectedKey1={selectedKey1}
          selectedKey2={selectedKey2}
          onKey1Change={setSelectedKey1}
          onKey2Change={setSelectedKey2}
          diffResult={diffResult}
        />
      )}
    </div>
  );
}

export default App;
