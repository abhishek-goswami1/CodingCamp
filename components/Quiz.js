import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";

function Quiz({ questions, onQuizPassed }) {
  const router = useRouter();
  const { user } = useUser();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const submitScore = async (finalAnswers) => {
    setSubmitting(true);
    try {
      const courseSlug = router.query.course;
      const res = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          course: courseSlug,
          answers: finalAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Could not save score");

      setScore(data.score);
      setShowScore(true);

      if (data.passed) {
        toast.success("Quiz passed! 🎉");
        if (onQuizPassed) onQuizPassed(); // Notify parent component
      } else {
        toast.error("You need 100% to pass. Try again!");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerButtonClick = (index) => {
    const newAnswers = [...answers, index];
    setAnswers(newAnswers);

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      submitScore(newAnswers);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowScore(false);
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <>
      {showScore ? (
        <div className="course__quiz-score">
          <p>
            Your score: <strong>{score}/{questions.length}</strong>
          </p>
          <button className="course__quiz-restart" onClick={handleRestart}>
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className="course__quiz-progress">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <div className="course__quiz-question">
            {questions[currentQuestion].question}
          </div>
          <div className="course__quiz-options">
            {submitting ? (
              <p>Grading quiz...</p>
            ) : (
              questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerButtonClick(index)}
                  className="course__quiz-select"
                >
                  {option.answer}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}

export default Quiz;
