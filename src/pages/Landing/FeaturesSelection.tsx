import React from "react";
import { FeaturesSectionWithCardGradient } from "./Features";

function FeaturesSectionWithCardGradientDemo() {
  return (
   <div>              <h1 className="flex items-center justify-center mt-32 text-5xl font-bold"> <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">- Features -</span> </h1>
   <FeaturesSectionWithCardGradient />
</div>
        
    
  );
}

export { FeaturesSectionWithCardGradientDemo };