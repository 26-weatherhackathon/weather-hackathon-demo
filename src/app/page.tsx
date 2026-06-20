import ChapterNav from "@/components/ui/ChapterNav";
import Opening from "@/components/chapters/Opening";
import Ch1Chaos from "@/components/chapters/Ch1Chaos";
import Ch2Observation from "@/components/chapters/Ch2Observation";
import Ch3Grid from "@/components/chapters/Ch3Grid";
import Ch4Feedback from "@/components/chapters/Ch4Feedback";
import Ch5Ensemble from "@/components/chapters/Ch5Ensemble";
import Ch6WeatherVsClimate from "@/components/chapters/Ch6WeatherVsClimate";
import Closing from "@/components/chapters/Closing";

export default function Home() {
  return (
    <main>
      <ChapterNav />
      <Opening />
      <Ch1Chaos />
      <Ch2Observation />
      <Ch3Grid />
      <Ch4Feedback />
      <Ch5Ensemble />
      <Ch6WeatherVsClimate />
      <Closing />
    </main>
  );
}
