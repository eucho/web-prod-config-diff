import { useState, useEffect } from 'react';
import * as Diff from 'diff';
import TextInputSection from './components/TextInputSection';
import ComparisonSection from './components/ComparisonSection';
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
      <h1>Web Config Diff</h1>
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
