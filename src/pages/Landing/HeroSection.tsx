import { Button } from "@/components/ui/button";
import Cloud from "@/components/ui/Cloud";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import SplineComponent from "@/components/ui/SplineComponent";

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
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden min-h-[100vh]">
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
        {/* Gradient overlay - fade from transparent at top to white in middle to sky blue at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 via-70% to-sky-200" />
      </div>
      
     <div className="container-main mx-auto flex justify-center items-center relative mt-6 z-10">
  <div className="flex flex-col gap-12 items-center mt-5 text-center">
    
    {/* Left Content */}
   <div className="space-y-8 animate-fade-in-up max-w-2xl text-center mx-auto">
  {/* CLEAR SKY COMPONENT START */}
  <div className="space-y-6 mt-16">
    {/* Badge */}
   
    {/* Branded Headline */}
    <h1 className="text-8xl md:text-7xl lg:text-[70px] font-extrabold leading-[1.1] tracking-tight text-slate-900 mt-32 ">
      The <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">Clear Sky</span> Protocol
    </h1>

    {/* Contextual Description */}
    <p className="text-lg text-slate-600 max-w-lg font-normal leading-relaxed mx-auto">
      On-chain AQI you can verify, refine, and rely on. </p>
  </div>
  {/* CLEAR SKY COMPONENT END */}

  <div className="flex flex-wrap gap-4 justify-center min-w-[100vh] ">
   

    
   
  </div>
</div>

  
  </div>
</div>

      {/* Spline Component - Full width below text */}
      <div className="absolute left-0 right-0 w-full h-[600px] z-0" style={{ top: 'calc(50% + 100px)' }}>
        <SplineComponent/>
      </div>

    </section>
  );
};

export default HeroSection;
