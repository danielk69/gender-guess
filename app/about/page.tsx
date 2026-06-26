const SECTIONS = [
  {
    title: "What is gender identity?",
    body: "Gender identity is a person's internal sense of their own gender. It may or may not align with the sex assigned at birth. Modern understanding recognizes gender as a spectrum and a deeply personal aspect of who someone is.",
  },
  {
    title: "What is transphobia?",
    body: "Transphobia refers to prejudice, discrimination, or antagonism directed at transgender people. It can include misgendering, exclusion, violence, and systemic barriers that deny transgender individuals equal rights and dignity.",
  },
  {
    title: "How can we promote inclusion?",
    body: "Promoting inclusion requires education, empathy, and systemic change. Use people's chosen names and pronouns, challenge harmful stereotypes, support equal rights, and listen to transgender voices.",
  },
  {
    title: "What is Gender Guesser?",
    body: "Gender Guesser is an interactive game that challenges assumptions about gender identity and appearance. You have 60 seconds to classify as many portraits as you can. The goal is to highlight how unreliable visual judgments can be, encouraging reflection on bias and greater understanding of gender diversity.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">About</h1>
      <div className="space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="mb-2 text-lg font-semibold">{s.title}</h2>
            <p className="leading-relaxed text-gray-600">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
