import FeedbackDisplay from '../FeedbackDisplay';

export default function FeedbackDisplayExample() {
  return (
    <div className="space-y-4 max-w-lg">
      <FeedbackDisplay
        feedback="Correct! PHI can be used for treatment if relevant to your duties."
        type="correct"
      />
      <FeedbackDisplay
        feedback="Partial credit for role awareness. However, you should confirm the specific access needed first."
        type="partial"
      />
      <FeedbackDisplay
        feedback="Incorrect. Access must be limited to job role and follow the Minimum Necessary Rule."
        type="incorrect"
      />
    </div>
  );
}
