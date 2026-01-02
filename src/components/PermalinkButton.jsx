function PermalinkButton({ onGenerate, isGenerating, permalinkUrl }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(permalinkUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="permalink-container">
      <button
        className="permalink-button"
        onClick={onGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Permalink'}
      </button>

      {permalinkUrl && (
        <div className="permalink-display">
          <input
            type="text"
            value={permalinkUrl}
            readOnly
            onClick={(e) => e.target.select()}
          />
          <button onClick={handleCopy}>Copy</button>
        </div>
      )}
    </div>
  );
}

export default PermalinkButton;
