import DiffViewer from './DiffViewer';

function ComparisonSection({ keys1, keys2, selectedKey1, selectedKey2, onKey1Change, onKey2Change, diffResult }) {
  return (
    <div className="comparison-section">
      <div className="dropdown-container">
        <div className="dropdown-wrapper">
          <label>Select Key from Left Side:</label>
          <select value={selectedKey1} onChange={(e) => onKey1Change(e.target.value)}>
            <option value="">-- Select Key --</option>
            {keys1.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <div className="dropdown-wrapper">
          <label>Select Key from Right Side:</label>
          <select value={selectedKey2} onChange={(e) => onKey2Change(e.target.value)}>
            <option value="">-- Select Key --</option>
            {keys2.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
      </div>
      {diffResult && (
        <DiffViewer diffResult={diffResult} />
      )}
    </div>
  );
}

export default ComparisonSection;
