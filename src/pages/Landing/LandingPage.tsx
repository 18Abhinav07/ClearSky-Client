import Awards from "./Awards";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";
import HeroSection from "./HeroSection";
import LogoBar from "./LogoBar";
import Navbar from "./Navbar";
import Testimonials from "./Testinmonial";
import SplineComponent from "@/components/ui/SplineComponent";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  return (
    <div className="bg-background text-foreground">
      <Navbar onGetStarted={onGetStarted} />
      <main>
        <HeroSection onGetStarted={onGetStarted} />
        <LogoBar />
                <SplineComponent />

        <Testimonials />
        <Awards />
        <FinalCTA onGetStarted={onGetStarted} />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
