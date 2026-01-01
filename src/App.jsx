import { useState, useEffect } from 'react';
import * as Diff from 'diff';
import TextInputSection from './components/TextInputSection';
import ComparisonSection from './components/ComparisonSection';
import { parseText, getKeys, getConfigValue } from './utils/parser';
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

      // Split into lines
      const lines1 = config1.split('\n').filter(line => line.trim());
      const lines2 = config2.split('\n').filter(line => line.trim());

      // Use diffArrays to get the differences
      const diff = Diff.diffArrays(lines1, lines2);

      // Process diff to create side-by-side line pairs
      const processedDiff = [];
      let index1 = 0;
      let index2 = 0;

      diff.forEach(part => {
        if (!part.added && !part.removed) {
          // Unchanged lines - show them as-is
          part.value.forEach(line => {
            processedDiff.push({ type: 'unchanged', line });
            index1++;
            index2++;
          });
        } else if (part.removed) {
          // Removed lines - store them temporarily
          const removedLines = part.value;
          index1 += removedLines.length;

          // Check if next part is added (then we can pair them)
          const nextPartIndex = diff.indexOf(part) + 1;
          if (nextPartIndex < diff.length && diff[nextPartIndex].added) {
            const addedLines = diff[nextPartIndex].value;
            index2 += addedLines.length;

            // Pair up removed and added lines
            const maxLen = Math.max(removedLines.length, addedLines.length);
            for (let i = 0; i < maxLen; i++) {
              if (i < removedLines.length && i < addedLines.length) {
                processedDiff.push({ type: 'modified', removed: removedLines[i], added: addedLines[i] });
              } else if (i < removedLines.length) {
                processedDiff.push({ type: 'removed', line: removedLines[i] });
              } else {
                processedDiff.push({ type: 'added', line: addedLines[i] });
              }
            }
            // Skip the next added part since we already processed it
            diff[nextPartIndex].processed = true;
          } else {
            // Just removed lines without corresponding additions
            removedLines.forEach(line => {
              processedDiff.push({ type: 'removed', line });
            });
          }
        } else if (part.added && !part.processed) {
          // Just added lines without corresponding removals
          part.value.forEach(line => {
            processedDiff.push({ type: 'added', line });
            index2++;
          });
        }
      });

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
