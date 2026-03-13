import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { X, Shield, AlertTriangle, ChevronRight } from 'lucide-react';
import { TUTORIAL_CONTENT } from '../../game/breach-defense/tutorialContent';
import { ASSETS } from '../../game/breach-defense/assets';
import { TOWERS, THREATS } from '../../game/breach-defense/constants';

interface CodexModalProps {
  onClose: () => void;
  seenThreats: string[];
  seenTowers: string[];
}

export function CodexModal({ onClose, seenThreats, seenTowers }: CodexModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'threats' | 'towers'>('threats');

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  const threatEntries = Object.entries(TUTORIAL_CONTENT.codex.threats);
  const towerEntries = Object.entries(TUTORIAL_CONTENT.codex.towers);

  const renderThreatDetail = (key: string) => {
    const entry = TUTORIAL_CONTENT.codex.threats[key as keyof typeof TUTORIAL_CONTENT.codex.threats];
    const isDiscovered = seenThreats.includes(key);

    if (!isDiscovered) {
      return (
        <div className="p-6 text-center text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">This threat hasn't been encountered yet.</p>
          <p className="text-xs mt-2">Keep playing to discover more!</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <img
            src={ASSETS.threats[key as keyof typeof THREATS]}
            alt={entry.name}
            className="w-12 h-12 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
          <div>
            <h3 className="font-bold text-lg">{entry.name}</h3>
            <p className="text-xs text-gray-600">{entry.description}</p>
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-200 p-3 rounded">
          <p className="text-xs font-bold text-red-800 mb-1">REAL WORLD EXAMPLE:</p>
          <p className="text-xs text-red-700">{entry.realWorld}</p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 p-3 rounded">
          <p className="text-xs font-bold text-green-800 mb-1">BEST COUNTERS:</p>
          <p className="text-xs text-green-700">{entry.counters}</p>
        </div>
      </div>
    );
  };

  const renderTowerDetail = (key: string) => {
    const entry = TUTORIAL_CONTENT.codex.towers[key as keyof typeof TUTORIAL_CONTENT.codex.towers];
    const isUnlocked = seenTowers.includes(key);

    if (!isUnlocked) {
      return (
        <div className="p-6 text-center text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">This defense hasn't been unlocked yet.</p>
          <p className="text-xs mt-2">Progress through waves to unlock more!</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <img
            src={ASSETS.towers[key as keyof typeof TOWERS]}
            alt={entry.name}
            className="w-12 h-12 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
          <div>
            <h3 className="font-bold text-lg">{entry.name}</h3>
            <p className="text-xs text-gray-600">{entry.description}</p>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded">
          <p className="text-xs font-bold text-blue-800 mb-1">HOW IT WORKS:</p>
          <p className="text-xs text-blue-700">{entry.howItWorks}</p>
        </div>

        <div className="bg-gray-50 border-2 border-gray-200 p-3 rounded">
          <p className="text-xs font-bold text-gray-800 mb-1">REAL WORLD:</p>
          <p className="text-xs text-gray-700">{entry.realWorld}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 border-2 border-green-200 p-2 rounded">
            <p className="text-[10px] font-bold text-green-800">STRONG AGAINST:</p>
            <p className="text-[10px] text-green-700">{entry.strongAgainst}</p>
          </div>
          <div className="bg-red-50 border-2 border-red-200 p-2 rounded">
            <p className="text-[10px] font-bold text-red-800">WEAK AGAINST:</p>
            <p className="text-[10px] text-red-700">{entry.weakAgainst}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200 ${
      isVisible ? 'bg-black/80' : 'bg-black/0'
    }`}>
      <div className={`bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-3xl w-full max-h-[80vh] flex flex-col transform transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
      }`}>
        <div className="bg-[#3498DB] border-b-4 border-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-white" />
            <h2 className="text-xl font-bold text-white">Security Codex</h2>
          </div>
          <button
            onClick={onClose}
            className="bg-white border-2 border-black p-1 hover:bg-gray-100"
            data-testid="button-close-codex"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b-4 border-black">
          <button
            onClick={() => { setActiveTab('threats'); setSelectedEntry(null); }}
            className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${
              activeTab === 'threats'
                ? 'bg-red-100 text-red-800 border-r-2 border-black'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-r-2 border-black'
            }`}
            data-testid="button-codex-threats"
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Threats ({seenThreats.length}/{Object.keys(THREATS).length})
          </button>
          <button
            onClick={() => { setActiveTab('towers'); setSelectedEntry(null); }}
            className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${
              activeTab === 'towers'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            data-testid="button-codex-towers"
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Defenses ({seenTowers.length}/{Object.keys(TOWERS).length})
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r-4 border-black overflow-y-auto bg-gray-50">
            {activeTab === 'threats' ? (
              threatEntries.map(([key, entry]) => {
                const isDiscovered = seenThreats.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedEntry(key)}
                    className={`w-full p-3 text-left border-b-2 border-gray-200 flex items-center gap-2 transition-colors ${
                      selectedEntry === key ? 'bg-red-100' : 'hover:bg-gray-100'
                    } ${!isDiscovered && 'opacity-50'}`}
                    data-testid={`codex-threat-${key.toLowerCase()}`}
                  >
                    {isDiscovered ? (
                      <img
                        src={ASSETS.threats[key as keyof typeof THREATS]}
                        alt={entry.name}
                        className="w-8 h-8 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                        <span className="text-lg">?</span>
                      </div>
                    )}
                    <span className="text-xs font-bold flex-1">
                      {isDiscovered ? entry.name : '???'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })
            ) : (
              towerEntries.map(([key, entry]) => {
                const isUnlocked = seenTowers.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedEntry(key)}
                    className={`w-full p-3 text-left border-b-2 border-gray-200 flex items-center gap-2 transition-colors ${
                      selectedEntry === key ? 'bg-blue-100' : 'hover:bg-gray-100'
                    } ${!isUnlocked && 'opacity-50'}`}
                    data-testid={`codex-tower-${key.toLowerCase()}`}
                  >
                    {isUnlocked ? (
                      <img
                        src={ASSETS.towers[key as keyof typeof TOWERS]}
                        alt={entry.name}
                        className="w-8 h-8 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                        <span className="text-lg">?</span>
                      </div>
                    )}
                    <span className="text-xs font-bold flex-1">
                      {isUnlocked ? entry.name : '???'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedEntry ? (
              activeTab === 'threats'
                ? renderThreatDetail(selectedEntry)
                : renderTowerDetail(selectedEntry)
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">Select an entry to learn more</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t-4 border-black bg-gray-100 text-center">
          <Button
            onClick={onClose}
            className="bg-[#FF6B9D] hover:bg-[#FF5A8A] text-white font-bold px-8 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer"
            data-testid="button-back-to-game"
          >
            Back to Game
          </Button>
        </div>
      </div>
    </div>
  );
}
