import ClassFlashcardsPage from "@/client-pages/flashcards/ClassFlashcardsPage";

export default async function FlashcardClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return <ClassFlashcardsPage classId={decodeURIComponent(classId)} />;
}
