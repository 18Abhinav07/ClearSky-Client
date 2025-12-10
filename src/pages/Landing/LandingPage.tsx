import { FeaturesSectionWithCardGradientDemo } from "./FeaturesSelection";
import Footer from "./Footer";
import HeroSection from "./HeroSection";
import Navbar from "./Navbar";
import Testimonials from "./Testinmonial";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  return (
    <div className="bg-background text-foreground">
      <Navbar onGetStarted={onGetStarted} />
      <main>
        <HeroSection onGetStarted={onGetStarted} />
                       <FeaturesSectionWithCardGradientDemo/>

        <Testimonials />

      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
