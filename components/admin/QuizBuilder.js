import { useState } from "react";
import { Plus, Trash2 } from "react-feather";

const EMPTY_OPTION = { answer: "", isCorrect: false };
const EMPTY_QUESTION = {
  question: "",
  options: [
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
  ],
};

/**
 * QuizBuilder — embeds in the course create/edit form.
 * Manages quiz questions entirely in component state and calls
 * onChange(questions) to bubble updated quiz data up to the parent form.
 *
 * @param {{ initialQuestions: Array, onChange: (questions: Array) => void }} props
 */
export default function QuizBuilder({ initialQuestions = [], onChange }) {
  const [questions, setQuestions] = useState(
    initialQuestions.length > 0 ? initialQuestions : []
  );

  const updateParent = (updated) => {
    setQuestions(updated);
    onChange(updated);
  };

  const addQuestion = () => {
    updateParent([...questions, JSON.parse(JSON.stringify(EMPTY_QUESTION))]);
  };

  const removeQuestion = (qi) => {
    updateParent(questions.filter((_, i) => i !== qi));
  };

  const updateQuestion = (qi, text) => {
    const updated = [...questions];
    updated[qi] = { ...updated[qi], question: text };
    updateParent(updated);
  };

  const updateOption = (qi, oi, text) => {
    const updated = [...questions];
    updated[qi].options[oi] = { ...updated[qi].options[oi], answer: text };
    updateParent(updated);
  };

  const setCorrect = (qi, oi) => {
    const updated = [...questions];
    updated[qi].options = updated[qi].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === oi,
    }));
    updateParent(updated);
  };

  const removeOption = (qi, oi) => {
    if (questions[qi].options.length <= 2) return; // Minimum 2 options
    const updated = [...questions];
    updated[qi].options = updated[qi].options.filter((_, i) => i !== oi);
    updateParent(updated);
  };

  const addOption = (qi) => {
    if (questions[qi].options.length >= 4) return; // Maximum 4 options
    const updated = [...questions];
    updated[qi].options = [...updated[qi].options, { ...EMPTY_OPTION }];
    updateParent(updated);
  };

  return (
    <div className="quiz-builder">
      {questions.length === 0 && (
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          No questions yet. Click &quot;Add Question&quot; to begin.
        </p>
      )}

      {questions.map((q, qi) => (
        <div className="quiz-question-card" key={qi}>
          <div className="quiz-question-card__header">
            <span>Question {qi + 1}</span>
            <button
              type="button"
              className="btn-admin-danger"
              onClick={() => removeQuestion(qi)}
              aria-label={`Remove question ${qi + 1}`}
            >
              <Trash2 size={13} /> Remove
            </button>
          </div>

          {/* Question text */}
          <div className="admin-form-group" style={{ marginBottom: "1rem" }}>
            <label htmlFor={`q-${qi}-text`}>Question</label>
            <input
              id={`q-${qi}-text`}
              type="text"
              value={q.question}
              placeholder="Enter your question…"
              onChange={(e) => updateQuestion(qi, e.target.value)}
            />
          </div>

          {/* Answer options */}
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
              Options — select the correct answer
            </label>
          </div>

          {q.options.map((opt, oi) => (
            <div className="quiz-option-row" key={oi} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              {/* Styled correct-answer tick button */}
              <button
                type="button"
                onClick={() => setCorrect(qi, oi)}
                aria-label={`Mark option ${oi + 1} as correct`}
                title={opt.isCorrect ? "Correct answer" : "Click to mark as correct"}
                style={{
                  flexShrink: 0,
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  border: opt.isCorrect ? "2px solid #16a34a" : "2px solid #64748b",
                  background: opt.isCorrect ? "#16a34a" : "transparent",
                  color: opt.isCorrect ? "#fff" : "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "bold",
                  transition: "all 0.15s",
                }}
              >
                {opt.isCorrect ? "✓" : "○"}
              </button>
              <input
                type="text"
                value={opt.answer}
                placeholder={`Option ${oi + 1}`}
                onChange={(e) => updateOption(qi, oi, e.target.value)}
                style={{
                  flex: 1,
                  border: opt.isCorrect ? "2px solid #16a34a" : undefined,
                  background: opt.isCorrect ? "rgba(22,163,74,0.07)" : undefined,
                }}
              />
              <button
                type="button"
                className="btn-admin-icon"
                onClick={() => removeOption(qi, oi)}
                disabled={q.options.length <= 2}
                aria-label={`Remove option ${oi + 1}`}
                style={{ opacity: q.options.length <= 2 ? 0.3 : 1 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {q.options.length < 4 && (
            <button
              type="button"
              className="btn-admin-secondary"
              onClick={() => addOption(qi)}
              style={{ marginTop: "0.5rem", fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
            >
              <Plus size={13} /> Add Option
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        className="quiz-add-question-btn"
        onClick={addQuestion}
      >
        <Plus size={16} />
        Add Question
      </button>
    </div>
  );
}
