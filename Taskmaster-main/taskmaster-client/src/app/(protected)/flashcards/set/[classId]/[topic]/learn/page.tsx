import LearnFlashcardsPage from "@/client-pages/flashcards/LearnFlashcardsPage";

export default async function FlashcardLearnRoute({
  params,
}: {
  params: Promise<{ classId: string; topic: string }>;
}) {
  const { classId, topic } = await params;
  return (
    <LearnFlashcardsPage
      classId={decodeURIComponent(classId)}
      topic={decodeURIComponent(topic)}
    />
  );
}
