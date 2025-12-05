import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden min-h-[85vh]">
      {/* Background image with fade effect */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/bg-clearsky.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay - fade from transparent at top to white at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white" />
      </div>
      
      <div className="container-main">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold leading-[1.1] tracking-tight text-black max-w-xl">
              Automate your startup workflows and scale delivery
            </h1>
            <p className="text-lg text-gray-700 max-w-md font-normal leading-relaxed">
              Streamline and manage your department's service delivery end-to-end, and enable digital transformation in a matter of days, not years.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                className="bg-black text-white hover:bg-gray-800 px-8 py-6 text-base font-semibold rounded-xl"
                size="lg"
              >
                Book a demo
              </Button>
              <Button
                variant="outline"
                className="border-2 border-black text-black hover:bg-gray-50 px-8 py-6 text-base font-semibold rounded-xl"
                size="lg"
                onClick={onGetStarted}
              >
                Get started
              </Button>
            </div>
          </div>

          {/* Right Visual - Image from bg */}
          <div className="relative animate-scale-in hidden lg:block" style={{ animationDelay: "0.2s" }}>
            {/* Empty - image is in background */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
