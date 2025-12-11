import React from "react";
import { useId } from "react";

export function FeaturesSectionWithCardGradient() {
  return (
    <div className="py-20 lg:py-40">

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 md:gap-2 max-w-7xl mx-auto">
        {grid.map((feature) => (
          <div
            key={feature.title}
            className="relative bg-gradient-to-b dark:from-neutral-900 from-neutral-100 dark:to-neutral-950 to-white p-6 rounded-3xl overflow-hidden"
          >
            <Grid size={10} />
            <p className="text-base font-bold text-neutral-800 dark:text-white relative z-20">
              {feature.title}
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4 text-base font-normal relative z-20">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const grid = [
  {
    title: "Cryptographic Data Integrity",
    description:
      "Every sensor reading is signed with ECDSA and anchored on-chain using Merkle Trees, ensuring absolute provenance and tamper-proof history.",
  },
  {
    title: "Monetizable Data Assets",
    description:
      "Register your sensor streams as Intellectual Property on Story Protocol. Set custom license terms and earn royalties instantly when buyers access your data.",
  },
  {
    title: "AI-Powered Derivatives",
    description:
      "Automatically transform raw environmental logs into actionable AI summaries. Our pipeline mints these insights as derivative IP assets, adding value to your stream.",
  },
  {
    title: "Smart Wallet Integration",
    description:
      "Onboard instantly using Passkeys—no seed phrases required. We leverage Coinbase Smart Wallet to sponsor gas fees, making your blockchain interactions invisible, secure, and friction-free.",
  },
  {
    title: "Secure Data Marketplace",
    description:
      "A decentralized bazaar for environmental data. Buyers purchase licenses on-chain to receive cryptographically signed permission slips for secure S3 downloads.",
  },
  {
    title: "Real-Time Environment Tracking",
    description:
      "Monitor critical metrics like CO2, PM2.5, and Temperature with live dashboards that visualize signed payloads the moment they hit the backend.",
  },
  {
    title: "Verifiable Audit Trail",
    description:
      "Complete transparency from the sensor's edge to the blockchain settlement. Inspect the lineage of every reading to verify it hasn't been altered.",
  },
  {
    title: "DePIN Infrastructure",
    description:
      "Join a Decentralized Physical Infrastructure Network where independent operators contribute to a global map of climate data without central gatekeepers.",
  },
];

export const Grid = ({
  pattern,
  size,
}: {
  pattern?: number[][];
  size?: number;
}) => {
  const p = pattern ?? [
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
  ];
  return (
    <div className="pointer-events-none absolute left-1/2 top-0  -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r  [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-zinc-900/30 from-zinc-100/30 to-zinc-300/30 dark:to-zinc-900/30 opacity-100">
        <GridPattern
          width={size ?? 10}
          height={size ?? 10}
          x="-12"
          y="4"
          squares={p}
          className="absolute inset-0 h-full w-full  mix-blend-overlay dark:fill-white/10 dark:stroke-white/10 stroke-black/10 fill-black/10"
        />
      </div>
    </div>
  );
};

export function GridPattern({ width, height, x, y, squares, ...props }: any) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]: any) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
