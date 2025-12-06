import { Button } from "@/components/ui/button";
import Cloud from "@/components/ui/Cloud";

interface FinalCTAProps {
  onGetStarted: () => void;
}

const FinalCTA = ({ onGetStarted }: FinalCTAProps) => {
  return (
    <section className="section-spacing bg-background relative overflow-hidden">
      <Cloud
        className="animate-float"
        style={{
          width: '500px',
          bottom: '-20%',
          left: '-10%',
          opacity: 0.1,
          animationDuration: '35s',
        }}
      />
      <div className="container-main">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div className="space-y-8">
            <h2 className="text-section-title text-foreground">
              Ready to save more time and money?
            </h2>
            <p className="text-body text-muted-foreground max-w-md">
              Join thousands of companies already using ClearSky to automate their workflows and scale their operations effortlessly.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" onClick={onGetStarted}>
                Get started
              </Button>
              <Button variant="heroOutline" size="lg">
                Contact sales
              </Button>
            </div>
          </div>

          {/* Right - Image */}
          <div className="relative">
            <img
              alt="Customer support savings chart"
              className="w-full max-w-md mx-auto h-auto"
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-soft-cyan/30 blur-3xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
