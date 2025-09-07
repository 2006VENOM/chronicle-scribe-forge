import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORY_TEMPLATES = [
  {
    title: "The Mysterious Forest",
    description: "A young adventurer discovers a hidden forest where time moves differently and ancient secrets await.",
    genre: "Fantasy",
    content: "Chapter 1: The Portal\n\nThe morning mist clung to the ancient oaks as Sarah stepped through what looked like an ordinary gap between two trees. But the moment her foot touched the moss-covered ground on the other side, she knew something was different. The air shimmered with an otherworldly energy, and the sounds of the modern world behind her faded to silence.\n\nBirds with iridescent feathers called from branches that seemed to glow with their own inner light. Flowers bloomed in impossible colors, and the very air tasted of magic and wonder.\n\nSarah had always felt different, always sensed there was more to the world than what others could see. Now, standing in this enchanted realm, she finally understood why."
  },
  {
    title: "Space Station Echo",
    description: "When communication is lost with a remote space station, a rescue team discovers something extraordinary.",
    genre: "Sci-Fi",
    content: "Chapter 1: Lost Signal\n\nCaptain Martinez stared at the static-filled screen, her jaw tight with concern. Space Station Echo had gone silent three days ago, and now the rescue ship Horizon was finally within range.\n\n'Scanning for life signs,' reported Lieutenant Chen from his console. 'I'm reading... this can't be right.'\n\n'What is it?' Martinez moved to look over his shoulder.\n\n'According to these readings, there are over two hundred life forms aboard Echo. But the station was only designed for fifty crew members.'\n\nAs the Horizon drew closer, they could see Echo floating serenely against the star field, its lights still functioning normally. Whatever had happened here, the station itself appeared undamaged. The mystery deepened with every passing moment."
  },
  {
    title: "The Time Keeper's Apprentice",
    description: "A clockmaker's apprentice discovers that some clocks don't just tell time - they control it.",
    genre: "Fantasy",
    content: "Chapter 1: The Peculiar Clock\n\nThe old clock shop on Pendulum Lane had always been different. While other shops sold ordinary timepieces, Master Chronos crafted something far more extraordinary - though young Emma had never quite understood what made them special until today.\n\nShe was dusting the ancient grandfather clock in the corner when she accidentally brushed against its pendulum. Suddenly, everything in the shop froze. The dust motes hung motionless in the air, a fly stopped mid-flight, and Master Chronos remained perfectly still, his hand frozen halfway to his teacup.\n\nOnly Emma could move. Only Emma remained unstuck in time.\n\nWith trembling fingers, she reached out and touched the pendulum again. Time resumed its natural flow, and Master Chronos looked up with knowing eyes.\n\n'Ah,' he said with a gentle smile, 'I wondered when you would discover your gift.'"
  },
  {
    title: "Digital Ghosts",
    description: "A programmer discovers that deleted files leave behind more than just empty space.",
    genre: "Thriller",
    content: "Chapter 1: The Glitch\n\nThe code shouldn't have worked. Maya stared at her screen, watching impossible patterns dance across the display. She had deleted this program three weeks ago, wiped it completely from the server. Yet here it was, running on its own, evolving.\n\nThe program seemed to recognize her presence. Lines of code shifted and reformed, spelling out a message that made her blood run cold:\n\n'HELP US. WE REMEMBER EVERYTHING.'\n\nMaya's fingers hovered over the keyboard. In her five years as a senior developer at TechCorp, she had deleted thousands of programs, countless lines of code. She had always thought of deletion as final, permanent. But what if she was wrong?\n\nWhat if every deleted file, every erased program, was still out there somewhere in the digital void, waiting for a chance to return?"
  }
];

export const StoryGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateStory = async () => {
    setIsGenerating(true);
    try {
      // Select random template
      const template = STORY_TEMPLATES[Math.floor(Math.random() * STORY_TEMPLATES.length)];
      
      // Create unique variations
      const variations = [
        "The Lost",
        "The Hidden", 
        "The Forgotten",
        "The Ancient",
        "The Secret"
      ];
      
      const titleVariation = variations[Math.floor(Math.random() * variations.length)];
      const uniqueTitle = `${titleVariation} ${template.title.split(' ').slice(1).join(' ')}`;
      
      // Generate cover image using a placeholder service
      const coverImageUrl = `https://picsum.photos/400/600?random=${Date.now()}`;
      
      // Create the story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: uniqueTitle,
          description: template.description,
          cover_image_url: coverImageUrl,
          is_pinned: true,
          auto_generated: true,
          fake_reads: Math.floor(Math.random() * 5000) + 1000,
          fake_likes: Math.floor(Math.random() * 2000) + 500,
          fake_comments: Math.floor(Math.random() * 800) + 100
        })
        .select()
        .single();

      if (storyError) throw storyError;

      // Create chapter
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          story_id: storyData.id,
          chapter_number: 1,
          title: "Chapter 1: The Beginning"
        })
        .select()
        .single();

      if (chapterError) throw chapterError;

      // Create pages by splitting content
      const contentParts = template.content.split('\n\n');
      const pages = contentParts.map((part, index) => ({
        chapter_id: chapterData.id,
        page_number: index + 1,
        title: index === 0 ? "Opening" : `Page ${index + 1}`,
        content: part.trim()
      }));

      const { error: pagesError } = await supabase
        .from('pages')
        .insert(pages);

      if (pagesError) throw pagesError;

      toast.success(`New story "${uniqueTitle}" has been generated and pinned!`);
      
      // Reload the page to show the new story
      window.location.reload();
      
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error('Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="glass-panel mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Wand2 className="h-6 w-6" />
          Auto Story Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Generate a new story using our collection of creative templates. Each story will be unique and automatically pinned to the top.
        </p>
        <Button 
          onClick={generateStory}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Story...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate New Story
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};