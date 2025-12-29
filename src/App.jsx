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
      const config1 = getConfigValue(parsedText1, selectedKey1);
      const config2 = getConfigValue(parsedText2, selectedKey2);
      const diff = Diff.diffChars(config1, config2);
      setDiffResult(diff);
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
