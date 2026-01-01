import * as Diff from 'diff';

function DiffViewer({ diffResult }) {
  const renderCharDiff = (removed, added) => {
    const charDiff = Diff.diffChars(removed, added);

    return (
      <div className="char-diff-pair">
        <div className="removed">
          {charDiff.map((part, idx) => {
            if (part.removed) {
              return <span key={idx} className="char-removed">{part.value}</span>;
            } else if (!part.added) {
              return <span key={idx} className="char-common">{part.value}</span>;
            }
            return null;
          })}
        </div>
        <div className="added">
          {charDiff.map((part, idx) => {
            if (part.added) {
              return <span key={idx} className="char-added">{part.value}</span>;
            } else if (!part.removed) {
              return <span key={idx} className="char-common">{part.value}</span>;
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="diff-viewer">
      <h3>Configuration Difference</h3>
      <div className="diff-content">
        {diffResult.map((item, index) => {
          if (item.type === 'unchanged') {
            return (
              <div key={index} className="unchanged">
                {item.line}
              </div>
            );
          } else if (item.type === 'removed') {
            return (
              <div key={index} className="removed">
                {item.line}
              </div>
            );
          } else if (item.type === 'added') {
            return (
              <div key={index} className="added">
                {item.line}
              </div>
            );
          } else if (item.type === 'modified') {
            return (
              <div key={index}>
                {renderCharDiff(item.removed, item.added)}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default DiffViewer;
