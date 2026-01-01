function TextInputSection({ text1, text2, onText1Change, onText2Change, onSubmit }) {
  return (
    <div className="text-input-section">
      <div className="text-areas-container">
        <div className="text-area-wrapper">
          <label>Left Side</label>
          <textarea
            value={text1}
            onChange={(e) => onText1Change(e.target.value)}
            placeholder="Enter text with format: Key_1=[config_1][config_2]..."
            rows={15}
          />
        </div>
        <div className="text-area-wrapper">
          <label>Right Side</label>
          <textarea
            value={text2}
            onChange={(e) => onText2Change(e.target.value)}
            placeholder="Enter text with format: Key_1=[config_1][config_2]..."
            rows={15}
          />
        </div>
      </div>
      <button className="submit-button" onClick={onSubmit}>
        Submit
      </button>
    </div>
  );
}

export default TextInputSection;
