import { Typewriter } from "~/components/ui/typewriter";

function TypewriterSection() {
  return (
    <section
      className="w-full min-h-screen flex items-center justify-center overflow-hidden px-[max(2.5vw,12px)] py-52 md:py-64 lg:py-80"
      style={{ color: "var(--text)" }}
    >
      <p
        className="whitespace-pre-wrap font-light text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-center"
        style={{ fontFamily: "PPEditorialNew, serif" }}
      >
        <span>{"We're born 🌞 to "}</span>
        <Typewriter
          text={["experience", "dance", "love", "be alive", "create"]}
          speed={70}
          className=""
          waitTime={1500}
          deleteSpeed={40}
          cursorChar={"_"}
        />
      </p>
    </section>
  );
}

export default TypewriterSection;
