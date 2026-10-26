/**
 * Words arriving one after another out of a blur. Adapted from React Bits' BlurText to plain
 * CSS (see `--animate-blur-in` in index.css), so it needs no animation library, and it stands
 * still for anyone who asked for less motion. Kept to the empty state: the table and the forms
 * never animate.
 */
export function BlurText({
  text,
  className,
  stepMs = 90,
}: {
  text: string;
  className?: string;
  /** How long each word waits after the one before it. */
  stepMs?: number;
}) {
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span
          // Words repeat, so the position is what tells two of them apart.
          key={`${index.toString()}-${word}`}
          className="inline-block animate-blur-in whitespace-pre motion-reduce:animate-none"
          style={{ animationDelay: `${(index * stepMs).toString()}ms` }}
        >
          {index === words.length - 1 ? word : `${word} `}
        </span>
      ))}
    </span>
  );
}
