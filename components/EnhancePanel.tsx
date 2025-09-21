/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface EnhancePanelProps {
  onApplyAdjustment: (prompt: string) => void;
  isLoading: boolean;
}

const Slider: React.FC<{
    label: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled: boolean;
}> = ({ label, value, onChange, min = -100, max = 100, step = 1, disabled }) => (
    <div className="w-full">
        <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-300">{label}</label>
            <span className="text-sm font-mono bg-gray-900/50 px-2 py-0.5 rounded">{value}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb:bg-blue-500"
        />
    </div>
);

const EnhancePanel: React.FC<EnhancePanelProps> = ({ onApplyAdjustment, isLoading }) => {
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [sharpness, setSharpness] = useState(0);

  const presets = [
    { name: 'Blur Background', prompt: 'Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.' },
    { name: 'Enhance Details', prompt: 'Slightly enhance the sharpness and details of the image without making it look unnatural.' },
    { name: 'Warmer Lighting', prompt: 'Adjust the color temperature to give the image warmer, golden-hour style lighting.' },
    { name: 'Studio Light', prompt: 'Add dramatic, professional studio lighting to the main subject.' },
  ];

  const handlePresetClick = (prompt: string) => {
    onApplyAdjustment(prompt);
  };
  
  const resetSliders = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSharpness(0);
  };
  
  const handleApplySliders = () => {
    const adjustments: string[] = [];
    if (brightness !== 0) adjustments.push(`${brightness > 0 ? 'increase' : 'decrease'} brightness by ${Math.abs(brightness)}%`);
    if (contrast !== 0) adjustments.push(`${contrast > 0 ? 'increase' : 'decrease'} contrast by ${Math.abs(contrast)}%`);
    if (saturation !== 0) adjustments.push(`${saturation > 0 ? 'increase' : 'decrease'} color saturation by ${Math.abs(saturation)}%`);
    if (sharpness !== 0) adjustments.push(`${sharpness > 0 ? 'increase' : 'decrease'} sharpness by ${Math.abs(sharpness)}%`);
    
    if (adjustments.length > 0) {
        const prompt = `Apply the following photorealistic adjustments to the image: ${adjustments.join(', ')}.`;
        onApplyAdjustment(prompt);
        resetSliders();
    }
  };

  const hasSliderChanged = brightness !== 0 || contrast !== 0 || saturation !== 0 || sharpness !== 0;

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-6 animate-fade-in backdrop-blur-sm">
      <div>
        <h3 className="text-lg font-semibold text-center text-gray-300">AI-Powered Presets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            {presets.map(preset => (
            <button
                key={preset.name}
                onClick={() => handlePresetClick(preset.prompt)}
                disabled={isLoading}
                className="w-full text-center bg-white/10 border border-transparent text-gray-200 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {preset.name}
            </button>
            ))}
        </div>
      </div>
      
      <div className="w-full h-px bg-gray-700"></div>

      <div>
        <h3 className="text-lg font-semibold text-center text-gray-300">Manual Adjustments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
            <Slider label="Brightness" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} disabled={isLoading} />
            <Slider label="Contrast" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} disabled={isLoading} />
            <Slider label="Saturation" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} disabled={isLoading} />
            <Slider label="Sharpness" value={sharpness} onChange={(e) => setSharpness(parseInt(e.target.value))} disabled={isLoading} />
        </div>
        <div className="flex gap-2 mt-6">
            <button
                onClick={resetSliders}
                disabled={isLoading || !hasSliderChanged}
                className="flex-1 bg-white/10 text-gray-200 font-semibold py-3 px-4 rounded-md transition-all hover:bg-white/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Reset
            </button>
            <button
                onClick={handleApplySliders}
                className="flex-1 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading || !hasSliderChanged}
            >
                Apply Adjustments
            </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancePanel;