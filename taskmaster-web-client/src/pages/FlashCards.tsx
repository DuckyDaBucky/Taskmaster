import React, { useState, useEffect } from "react"; // Added React import for clarity
import { apiService } from "../services/apiService";
import { motion } from "framer-motion";

// Interfaces (Original + UserData)
interface ClassData {
  _id: string;
  name: string;
  topics: string[]; // Keep if needed by UI or logic
}

interface FlashcardsData {
  topic: string;
  question: string;
  answer: string;
}

type MCQ = {
  question: string;
  correct: string;
  options: string[];
};

// Added from second snippet
interface UserData {
  _id: string;
}

const FlashCards: React.FC = () => {
  // State Variables (Original + Generation Popup State)
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardsData[] | null>(null);
  const [loading, setLoading] = useState(false); // Combined loading state
  const [generating, setGenerating] = useState(false); // Specific loading state for generation
  const [error, setError] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const [mode, setMode] = useState<"flashcards" | "test">("flashcards");
  const [testSettings, setTestSettings] = useState<{
    scope: "topic" | "class"; // Simplified scope based on actual implementation
    count: number;
  }>({ scope: "topic", count: 10 });
  const [testQuestions, setTestQuestions] = useState<MCQ[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Added from second snippet
  const [showGeneratePopup, setShowGeneratePopup] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null); // To hold ID for popup action
  const token = localStorage.getItem("token"); // Get token once

  // Utility Function (Original)
  const shuffle = <T,>(arr: T[]): T[] =>
    [...arr].sort(() => Math.random() - 0.5);

  // Fetch Classes (Updated with Auth and Endpoint)
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true); // Start loading indicator
      setError(null);

      if (!token) {
          setError("Authentication token not found. Please log in.");
          setLoading(false);
          return;
      }

      try {
        // 1) Get user ID
        const userRes = await apiService.getUserMe(token);
        const userId = userRes._id;

        // 2) Fetch classes for that user
        const classes = await apiService.getClassesByUserId(userId, token);
        setClasses(classes);
      } catch (err: any) {
        console.error("Error fetching classes:", err);
        const message = err.response?.data?.message || err.message || "Failed to fetch classes.";
        setError(message);
      } finally {
        setLoading(false); // Stop loading indicator
      }
    };

    fetchClasses();
  }, [token]); // Depend on token

  // Fetch Flashcards (Updated Endpoint)
  const fetchFlashcards = async (classId: string) => {
    setLoading(true); // Use the main loading state
    setFlashcards(null); // Reset flashcards when fetching new ones
    setSelectedTopic(null); // Reset topic filter
    setError(null); // Clear previous errors
    setCurrentCardIndex(0); // Reset card index
    setIsFlipped(false); // Reset flip state

    try {
      const flashcards = await apiService.getFlashcardsByClassId(classId, token);
      setFlashcards(flashcards || []); // Ensure flashcards is an array
      // Reset states relevant to displaying cards
      setCurrentCardIndex(0);
      setIsFlipped(false);

    } catch (err: any) {
      console.error("Error fetching flashcards:", err);
      const message = err.response?.data?.message || err.message || "Error fetching flashcards.";
      setError(message);
      setFlashcards([]); // Set to empty array on error to show "No flashcards found" message
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

   // Generate Flashcards Function (Added)
   const generateFlashCards = async (classId: ClassData["_id"]) => {
    if (!classId) return;
    setGenerating(true); // Start generation loading state
    setError(null);
    setShowGeneratePopup(false); // Close popup immediately
    try {
        await apiService.generateFlashcards(classId, token);
        console.log("Flashcard generation started successfully");
        // Provide feedback that generation is in progress
        setError("Flashcard generation initiated. Please wait a few minutes and refresh or re-select the class.");
        // Do not automatically refetch immediately, as generation takes time.
    } catch (err: any) {
        console.error("Error generating flashcards:", err);
        const message = err.response?.data?.message || err.message || "Error generating flashcards.";
        setError(message);
    } finally {
        setGenerating(false); // Stop generation loading state
    }
   };


  // Event Handlers (Original, slightly adjusted handleClassClick)
  const handleClassClick = (cls: ClassData) => {
    if (selectedClass?._id === cls._id) return; // Avoid refetching if already selected

    setSelectedClass(cls);
    fetchFlashcards(cls._id); // Fetch cards for the newly selected class
    // Reset states when class changes
    setMode("flashcards");
    setShowResults(false);
    setTestQuestions([]);
    setSelectedTopic(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setError(null); // Clear errors from previous class
  };

  // Derived Data (Original)
  const topics = flashcards
    ? Array.from(new Set(flashcards.map((c) => c.topic)))
    : [];
  const filteredCards = flashcards
    ? selectedTopic
      ? flashcards.filter((c) => c.topic === selectedTopic)
      : flashcards
    : [];

  // Test Logic (Original, with safety checks)
  const startTest = () => {
    if (!flashcards || flashcards.length === 0) {
        setError("No flashcards available to start a test.");
        return;
    }

    let pool = flashcards;
    if (testSettings.scope === "topic" && selectedTopic) {
      pool = flashcards.filter((c) => c.topic === selectedTopic);
    } else if (testSettings.scope === "class"){
        pool = flashcards; // Pool is all cards for the class
    }
     // Ensure the filtered pool has cards
     if (pool.length === 0) {
        setError(`No cards available for the selected scope ('${selectedTopic || 'Full Class'}').`);
        return;
     }

    // Determine sample size, ensure it's not more than available pool size
    const requestedCount = testSettings.count || 10; // Default to 10 if count is somehow invalid
    const sampleSize = Math.min(requestedCount, pool.length);
    const sample = shuffle(pool).slice(0, sampleSize);

    const mcqs: MCQ[] = sample.map((card) => {
      // Create distractors pool excluding the correct answer
      const distractorsPool = pool.filter((c) => c.answer !== card.answer && c.answer); // Ensure answers exist
      // Shuffle and pick unique distractors, ensure we have enough unique ones, fallback if needed
      const uniqueDistractorAnswers = Array.from(new Set(distractorsPool.map(c => c.answer)));
      const distractors = shuffle(uniqueDistractorAnswers).slice(0, 3);
      // Ensure 4 options total, padding if necessary (though unlikely with typical data)
      const currentOptions = shuffle([card.answer, ...distractors]);
      while (currentOptions.length < Math.min(4, pool.length)) { // Ensure at least 2 options, up to 4 or pool size
         const filler = pool.find(c => !currentOptions.includes(c.answer))?.answer || `Option ${currentOptions.length + 1}`;
         if (!currentOptions.includes(filler)) {
            currentOptions.push(filler);
         } else { // Avoid infinite loop if somehow only one answer exists
             break;
         }
      }

      return { question: card.question, correct: card.answer, options: currentOptions };
    });

    if (mcqs.length === 0) {
        setError("Could not generate any test questions from the available cards.");
        return;
    }

    setTestQuestions(mcqs);
    setUserAnswers(Array(mcqs.length).fill(""));
    setCurrentTestIndex(0);
    setMode("test");
    setShowResults(false);
    setError(null); // Clear previous errors
  };

  const selectAnswer = (ans: string) => {
    setUserAnswers((ua) => {
      const copy = [...ua];
      // Ensure index is valid before assignment
      if (currentTestIndex >= 0 && currentTestIndex < copy.length) {
         copy[currentTestIndex] = ans;
      }
      return copy;
    });
  };

  const calculateScore = () => {
    if (testQuestions.length === 0) return 0;
    return userAnswers.reduce((score, answer, index) => {
      // Added safety check for testQuestions[index]
      return score + (testQuestions[index] && answer === testQuestions[index].correct ? 1 : 0);
    }, 0);
  };


  // --- Original JSX Structure and Styling (Preserved) ---

  // Early return for critical error (only if classes fail to load initially)
  if (error && !loading && classes.length === 0) {
    return <div className="text-center text-destructive mt-6">{error}</div>;
  }

  return (
    // Use original theme classes
    <div className="relative min-h-screen w-full overflow-hidden text-gray-900 dark:text-white">
        {/* Optional: Add a background component if desired */}
        {/* <AnimatedBackground /> */}

        {/* Original Header (minor style adjustments for consistency if needed) */}
        <header className="relative z-10 bg-card text-card-foreground shadow-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-emphasis">
                Flashcards & Testing
            </h1>
            </div>
        </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
         {/* Display non-critical errors here using original theme */}
         {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/30">{error}</div>}

        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel (Classes & Topics) - Original Styling */}
          <div className="col-span-12 md:col-span-3 space-y-6">
            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-4">
              <h2 className="text-lg font-semibold text-emphasis mb-3">
                Classes
              </h2>
               {/* Show loading state specifically for classes if needed */}
              {loading && classes.length === 0 ? (
                  <p className="text-muted-foreground">Loading classes...</p>
              ) : classes.length === 0 && !loading ? (
                  <p className="text-muted-foreground">No classes found.</p>
              ): (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1"> {/* Added max-height */}
                    {classes.map((cls) => (
                    <motion.div
                        key={cls._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleClassClick(cls)}
                        className={`cursor-pointer p-3 rounded-lg border transition-all ${
                        selectedClass?._id === cls._id
                            ? "bg-primary text-primary-foreground border-primary/50 ring-1 ring-primary" // Enhanced selected style
                            : "bg-background text-foreground border-border hover:border-accent" // Original default style
                        }`}
                    >
                        <h3 className="font-medium">
                        {cls.name}
                        </h3>
                    </motion.div>
                    ))}
                </div>
              )}
            </div>

            {/* Topic Selection - Original Styling */}
            {selectedClass && topics.length > 0 && !loading && flashcards && flashcards.length > 0 && ( // Show only if topics exist for selected class
              <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-4">
                <h2 className="text-lg font-semibold text-emphasis mb-3">
                  Topics
                </h2>
                <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1"> {/* Added max-height */}
                  <button
                    onClick={() => { setSelectedTopic(null); setCurrentCardIndex(0); setIsFlipped(false);}} // Reset state on topic change
                    className={`w-full text-left p-2 rounded-lg transition-all font-medium ${
                      selectedTopic === null
                        ? "bg-primary text-primary-foreground" // Original selected style
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground" // Original default style
                    }`}
                  >
                    All Topics ({flashcards?.length || 0})
                  </button>
                  {topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setSelectedTopic(t); setCurrentCardIndex(0); setIsFlipped(false);}} // Reset state on topic change
                      className={`w-full text-left p-2 rounded-lg transition-all font-medium ${
                        selectedTopic === t
                          ? "bg-primary text-primary-foreground" // Original selected style
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground" // Original default style
                      }`}
                    >
                      {t} ({flashcards?.filter(c => c.topic === t).length || 0})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel (Content Area) - Original Styling */}
          <div className="col-span-12 md:col-span-9">
            {/* Mode Selection & Test Settings - Original Styling */}
            {selectedClass && ( // Only show controls if a class is selected
              <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex space-x-2">
                    {["flashcards", "test"].map((m) => (
                      <button
                        key={m}
                        onClick={() => { setMode(m as "flashcards" | "test"); setShowResults(false); setTestQuestions([]); setError(null); }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          mode === m
                            ? "bg-primary text-primary-foreground" // Original selected style
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80" // Original default style
                        }`}
                        // Disable test button if no flashcards exist or if generating
                        disabled={generating || (m === 'test' && (!flashcards || flashcards.length === 0))}
                        title={generating ? "Generation in progress" : (m === 'test' && (!flashcards || flashcards.length === 0) ? "No flashcards available to start a test" : "")}
                      >
                        {m === "flashcards" ? "Flashcards" : "Test"}
                      </button>
                    ))}
                  </div>

                  {/* Test Settings - Original Styling */}
                   {/* Show settings only before test starts and if not showing results */}
                  {mode === "test" && testQuestions.length === 0 && !showResults && flashcards && flashcards.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <select
                        value={testSettings.scope}
                        onChange={(e) => setTestSettings((s) => ({ ...s, scope: e.target.value as any }))}
                        className="border border-input rounded-lg px-3 py-2 bg-input text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        // Disable topic scope if no specific topic is selected OR if no topics exist at all
                        disabled={testSettings.scope === 'topic' && (!selectedTopic || topics.length === 0)}
                      >
                        {/* Disable topic option if no topic selected */}
                        <option value="topic" disabled={!selectedTopic && topics.length > 0}>
                            {selectedTopic ? `Topic: ${selectedTopic}` : (topics.length === 0 ? "No Topics Available" : "Select Topic First")}
                        </option>
                        <option value="class">Full Class</option>
                      </select>
                      <select
                        value={testSettings.count}
                        onChange={(e) => setTestSettings((s) => ({ ...s, count: parseInt(e.target.value) }))}
                        className="border border-input rounded-lg px-3 py-2 bg-input text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {[5, 10, 15, 20].map(n => {
                            // Determine max available cards for the scope
                            const maxAvailable = selectedTopic
                                ? filteredCards.length
                                : flashcards?.length || 0;
                            if (n <= maxAvailable) {
                                return <option key={n} value={n}>{n} Questions</option>;
                            }
                            return null;
                        })}
                         <option value={ selectedTopic ? filteredCards.length : flashcards?.length || 0 }>
                           All ({ selectedTopic ? filteredCards.length : flashcards?.length || 0 })
                         </option>
                      </select>
                      <button
                        onClick={startTest}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
                         // Disable if no cards, or if scope is topic but no topic selected
                        disabled={!flashcards || flashcards.length === 0 || (testSettings.scope === 'topic' && !selectedTopic)}
                        title={!flashcards || flashcards.length === 0 ? "No flashcards loaded" : (testSettings.scope === 'topic' && !selectedTopic) ? "Select a topic first" : "Start the test"}
                      >
                        Start Test
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Content Area (Flashcards or Test) */}
            <div className="relative min-h-[400px] bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
                {/* Loading/Generating Indicator overlay */}
               {(loading || generating) && (
                  <div className="absolute inset-0 bg-card/80 flex items-center justify-center z-20 rounded-lg">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                        <p className="text-muted-foreground">{generating ? 'Generating flashcards...' : 'Loading...'}</p>
                    </div>
                  </div>
                )}

              {/* Flashcard Mode UI - Original Styling */}
               {/* Ensure flashcards are loaded and not in test mode */}
              {mode === "flashcards" && !loading && !generating && filteredCards.length > 0 && (
                <div className="flex flex-col items-center space-y-4">
                   {/* Card Navigation - Original Styling */}
                   <div className="flex items-center justify-between w-full max-w-xl">
                     <button
                       onClick={() => {setCurrentCardIndex(i => Math.max(0, i - 1)); setIsFlipped(false);}}
                       disabled={currentCardIndex === 0}
                       className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg disabled:opacity-50 transition hover:bg-secondary/80"
                     >Prev</button>
                     <span className="text-muted-foreground font-medium">
                       Card {currentCardIndex + 1} of {filteredCards.length}
                     </span>
                     <button
                       onClick={() => {setCurrentCardIndex(i => Math.min(filteredCards.length - 1, i + 1)); setIsFlipped(false);}}
                       disabled={currentCardIndex === filteredCards.length - 1}
                         className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg disabled:opacity-50 transition hover:bg-secondary/80"
                     >Next</button>
                   </div>

                  {/* Flippable Card - Updated to show question on the front and answer on the back */}
             <motion.div
               key={currentCardIndex + (selectedTopic || 'all')}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
               className="w-full max-w-xl h-64 perspective-[1000px] cursor-pointer"
               onClick={() => setIsFlipped((f) => !f)}
             >
               <motion.div
                 className="relative w-full h-full transition-transform duration-500 preserve-3d"
                 animate={{ rotateY: isFlipped ? 180 : 0 }}
                 style={{ transformStyle: 'preserve-3d' }}
               >
                 {/* Front - Question */}
                 <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center text-center p-6 bg-card border border-border rounded-lg shadow-md"
                      style={{ backfaceVisibility: 'hidden' }}>
                   <span className="text-sm text-muted-foreground mb-2">
                     {filteredCards[currentCardIndex]?.topic || 'No Topic'}
                   </span>
                   <p className="text-lg font-semibold text-card-foreground">
                     {filteredCards[currentCardIndex]?.question || 'No Question'}
                   </p>
                   <span className="text-xs text-muted-foreground mt-4">Click to flip</span>
                 </div>

                 {/* Back - Answer */}
                 <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center text-center p-6 bg-secondary border border-border rounded-lg shadow-md"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}>
                   <p className="text-lg font-semibold text-secondary-foreground">
                     {filteredCards[currentCardIndex]?.answer || 'No Answer'}
                   </p>
                   <span className="text-xs text-muted-foreground mt-4">Click to flip back</span>
                 </div>
               </motion.div>
             </motion.div>
                </div>
              )}

              {/* Test Mode UI - Original Styling */}
               {/* Check mode and if questions are loaded */}
              {mode === "test" && !loading && !generating && testQuestions.length > 0 && (
                <div className="flex flex-col items-center space-y-6">
                  {!showResults ? (
                    <>
                      <div className="w-full max-w-2xl text-center">
                        <p className="text-sm text-muted-foreground mb-1">Question {currentTestIndex + 1} of {testQuestions.length}</p>
                        <p className="text-xl font-semibold text-foreground">
                           {/* Added safety check */}
                           {testQuestions[currentTestIndex]?.question}
                        </p>
                      </div>
                      {/* Test Options - Original Styling */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                         {/* Added safety check */}
                        {testQuestions[currentTestIndex]?.options.map((opt, i) => (
                          <button
                            key={`${currentTestIndex}-${i}`} // More specific key
                            onClick={() => selectAnswer(opt)}
                            className={`p-4 rounded-lg border transition-all text-left font-medium ${
                              userAnswers[currentTestIndex] === opt
                                ? "bg-primary text-primary-foreground border-primary/50 ring-2 ring-primary" // Original selected style
                                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border-border" // Original default style
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                       {/* Test Navigation - Original Styling */}
                        <div className="flex items-center justify-between w-full max-w-2xl pt-4">
                             <button
                                 onClick={() => setCurrentTestIndex(i => Math.max(0, i - 1))}
                                 disabled={currentTestIndex === 0}
                                 className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg disabled:opacity-50 transition hover:bg-secondary/80"
                             >Prev</button>
                             <button
                                 onClick={() => {
                                     if (currentTestIndex === testQuestions.length - 1) {
                                         setShowResults(true); // Show results immediately
                                     } else {
                                         setCurrentTestIndex(i => i + 1);
                                     }
                                 }}
                                 className="px-4 py-2 bg-primary text-primary-foreground rounded-lg transition hover:bg-primary/90"
                             >
                                 {currentTestIndex === testQuestions.length - 1 ? "Finish" : "Next"}
                            </button>
                         </div>
                    </>
                  ) : (
                     // Test Results View - Original Styling
                    <div className="w-full max-w-2xl text-center space-y-4 py-8">
                        <h2 className="text-2xl font-bold text-emphasis">Test Results</h2>
                        <p className="text-xl text-foreground">
                            Your Score: {calculateScore()} / {testQuestions.length}
                        </p>
                        <div className="flex justify-center space-x-4 pt-4">
                            <button
                                onClick={() => { setMode("flashcards"); setTestQuestions([]); setShowResults(false); }}
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg transition hover:bg-secondary/80"
                            >
                                Back to Flashcards
                            </button>
                             <button
                                onClick={startTest} // Reuse startTest to retry
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg transition hover:bg-primary/90"
                            >
                                Retry Test
                            </button>
                         </div>
                     </div>
                  )}
                </div>
              )}

              {/* Placeholder/Generate Button Area - Render conditions refined */}
               {!loading && !generating && selectedClass && flashcards?.length === 0 && (
                   <div className="text-center py-12 space-y-4">
                       <p className="text-muted-foreground">No flashcards found for {selectedClass.name}.</p>
                       <button
                            // Style using original theme's primary button style
                           className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition"
                           onClick={() => {
                               if (selectedClass) {
                                   setSelectedClassId(selectedClass._id); // Store the class ID
                                   setShowGeneratePopup(true); // Show the popup
                               }
                           }}
                         >
                           Generate Flashcards
                       </button>
                       <p className="text-xs text-muted-foreground">(Generation may take up to 2 minutes)</p>
                   </div>
               )}
               {/* Initial state before class selection */}
               {!selectedClass && !loading && !generating && (
                 <p className="text-center text-muted-foreground py-12">Select a class to view or generate flashcards.</p>
               )}
               {/* Placeholder if test mode selected but no questions */}
               {mode === 'test' && testQuestions.length === 0 && !showResults && flashcards && flashcards.length > 0 && (
                    <p className="text-center text-muted-foreground py-12">Configure test settings above and click "Start Test".</p>
               )}

            </div>
          </div>
        </div>
      </main>

        {/* Generate Flashcards Popup Modal - Styled with original theme */}
       {showGeneratePopup && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
           {/* Use motion for entry animation */}
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9 }}
             className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md border border-border"
           >
             <h2 className="text-xl font-bold text-emphasis mb-4">Generate Flashcards</h2>
             <p className="text-muted-foreground mb-6">
                Flashcard generation uses AI and may take up to 2 minutes. Do you want to proceed for <span className="font-medium text-foreground">{selectedClass?.name}</span>?
             </p>
             <div className="flex justify-end space-x-3">
                {/* Cancel Button - Use secondary/muted style */}
               <button
                 onClick={() => setShowGeneratePopup(false)}
                 className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg transition hover:bg-secondary/80"
               >
                 Cancel
               </button>
                {/* Proceed Button - Use primary style */}
               <button
                 onClick={() => {
                     if (selectedClassId) {
                         generateFlashCards(selectedClassId);
                     }
                 }}
                 className="px-4 py-2 bg-primary text-primary-foreground rounded-lg transition hover:bg-primary/90"
               >
                 Proceed
               </button>
             </div>
           </motion.div>
         </div>
       )}

       {/* Results Modal could also be implemented here using motion.div if preferred */}

    </div>
  );
};

export default FlashCards;