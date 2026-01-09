import FlashcardSetPage from "@/client-pages/flashcards/FlashcardSetPage";

export default async function FlashcardSetRoute({
  params,
}: {
  params: Promise<{ classId: string; topic: string }>;
}) {
  const { classId, topic } = await params;
  return (
    <FlashcardSetPage
      classId={decodeURIComponent(classId)}
      topic={decodeURIComponent(topic)}
    />
  );
}
