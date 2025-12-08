import { Button } from "@/components/ui/button";
import Cloud from "@/components/ui/Cloud";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const handleNavigateToRegisterDevice = () => {
    // Implement navigation logic here
    navigate("/register-device");

  };
  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden min-h-[85vh]">
      <Cloud
        className="animate-float"
        style={{
          width: '300px',
          top: '10%',
          right: '-5%',
          opacity: 0.8,
          animationDuration: '25s',
        }}
      />
      <Cloud
        className="animate-float"
        style={{
          width: '200px',
          top: '40%',
          left: '-10%',
          opacity: 0.6,
          animationDuration: '30s',
          animationDelay: '5s'
        }}
      />

      {/* Background image with fade effect */}
      <div className="absolute inset-0">
        <img
          src="/herobg.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay - fade from transparent at top to white at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white" />
      </div>
      
     <div className="container-main mx-auto flex justify-center items-center relative mt-6">
  <div className="flex flex-col gap-12 items-center mt-5 text-center">
    
    {/* Left Content */}
   <div className="space-y-8 animate-fade-in-up max-w-2xl text-center mx-auto">
  {/* CLEAR SKY COMPONENT START */}
  <div className="space-y-6">
    {/* Badge */}
    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700 text-sm font-medium mb-2">
      <span className="relative flex h-2 w-2 mr-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
      </span>
      Live Network • 4 Cities
    </div>

    {/* Branded Headline */}
    <h1 className="text-4xl md:text-5xl lg:text-[64px] font-extrabold leading-[1.1] tracking-tight text-slate-900">
      The <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">Clear Sky</span> Protocol
    </h1>

    {/* Contextual Description */}
    <p className="text-lg text-slate-600 max-w-lg font-normal leading-relaxed mx-auto">
      The decentralized physical infrastructure layer for verifiable air quality intelligence. 
      Register sensors, cryptographically sign readings, and monetize trusted data on-chain.
    </p>
  </div>
  {/* CLEAR SKY COMPONENT END */}

  <div className="flex flex-wrap gap-4 justify-center pt-10 mt-10 space-x-4">
    {!isAuthenticated &&<Button 
      className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-sky-900/10 transition-all hover:scale-105" 
      size="lg"
      onClick={onGetStarted}
    >
      Register your device
    </Button>}
    {isAuthenticated &&<Button 
      className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-sky-900/10 transition-all hover:scale-105" 
      size="lg"
      onClick={handleNavigateToRegisterDevice}
    >
      Register your device
    </Button>}

    
    <Button
      variant="outline"
      className="border-2 border-slate-200 text-slate-700 hover:border-sky-200 hover:bg-sky-50 px-8 py-6 text-base font-semibold rounded-xl transition-colors"
      size="lg"
    >
      View Network Map
    </Button>
  </div>
</div>


    {/* Right Visual */}
    <div className="relative animate-scale-in hidden lg:block" style={{ animationDelay: "0.2s" }}>
      {/* empty */}
    </div>
  </div>
</div>

    </section>
  );
};

export default HeroSection;
