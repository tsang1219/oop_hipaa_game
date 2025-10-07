import ChoiceButton from '../ChoiceButton';

export default function ChoiceButtonExample() {
  return (
    <div className="space-y-2 max-w-lg">
      <ChoiceButton
        text="Let's confirm if it's needed for treatment before accessing."
        onClick={() => console.log('Choice selected')}
      />
      <ChoiceButton
        text="Sure, I'll give you full access to the EHR."
        onClick={() => console.log('Choice selected')}
      />
    </div>
  );
}
