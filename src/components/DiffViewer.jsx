function DiffViewer({ diffResult }) {
  return (
    <div className="diff-viewer">
      <h3>Configuration Difference</h3>
      <div className="diff-content">
        {diffResult.map((part, index) => {
          const className = part.added ? 'added' : part.removed ? 'removed' : 'unchanged';
          return (
            <span key={index} className={className}>
              {part.value}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default DiffViewer;
