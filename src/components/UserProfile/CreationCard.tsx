/**
 * Creation Card Component
 *
 * Displays an owned IP asset (user's derivative creation)
 * Shows revenue stats and claim button
 */

import { useState, useEffect } from "react";

import { Button } from "../ui/button";

import { type RefinedReport } from "../../services/api/marketplace.service";



interface CreationCardProps {

  creation: RefinedReport;

  onClaimRevenue: () => void; // This will likely be unused or changed later

  onOpenDetails: () => void;

}



export function CreationCard({ creation, onClaimRevenue: _onClaimRevenue, onOpenDetails }: CreationCardProps) {

  const [title, setTitle] = useState(creation.title || "Loading...");

  const [description, setDescription] = useState(creation.description || "Loading...");



  useEffect(() => {

    async function parseDetails() {

      if (!creation.title && creation.content) {

        const titleMatch = creation.content.match(/# 📜 (.*)/);

        const newTitle = titleMatch ? titleMatch[1] : 'Untitled Derivative';

        

        const locationMatch = creation.content.match(/\*\*Location\*\*: (.*)/);

        const newDescription = locationMatch ? `Location: ${locationMatch[1]}` : 'No description available.';



        setTitle(newTitle);

        setDescription(newDescription);

      }

    }

    parseDetails();

  }, [creation.content, creation.title]);





  return (

    <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white backdrop-blur-sm transition-all hover:border-green-400 hover:shadow-xl hover:shadow-green-100">

      {/* Gradient overlay */}

      <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />



      {/* Thumbnail */}

      {creation.thumbnailUrl && (

        <div className="relative h-48 overflow-hidden">

          <img

            src={creation.thumbnailUrl}

            alt={title}

            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"

          />

          <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />

        </div>

      )}



      <div className="relative p-6 space-y-4">

        {/* Header */}

        <div>

          <h3 className="text-lg font-bold text-slate-900 font-cairo line-clamp-2">

            {title}

          </h3>

          <p className="text-sm text-slate-600 mt-2 line-clamp-2">

            {description}

          </p>

        </div>



        {/* IP ID */}

        <div className="flex items-center gap-2 text-xs text-slate-600">

          <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">

            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 012 0v4a1 1 0 01-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" />

          </svg>

          <span>IP Asset:</span>

          <span className="font-mono">

            {creation.ip_id?.slice(0, 6)}...{creation.ip_id?.slice(-4)}

          </span>

        </div>



        {/* Divider */}

        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />



        {/* View Details Button */}

        <Button 
          onClick={onOpenDetails} 
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition-all"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Details
          </span>
        </Button>

      </div>

    </div>

  );

}
