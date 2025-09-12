/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, generateEnhancedImage, extractTextFromImage, detectFaces, removeBackground } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import ResizePanel from './components/ResizePanel';
import ExportModal from './components/ExportModal';
import ExtractTextPanel from './components/ExtractTextPanel';
import FaceDetectionPanel, { type BoundingBox } from './components/FaceDetectionPanel';
import BackgroundPanel from './components/BackgroundPanel';
import { UndoIcon, RedoIcon, EyeIcon, MagicWandIcon, ExportIcon, SparkleIcon } from './components/icons';
import StartScreen from './components/StartScreen';
import Toast from './components/Toast';
import Footer from './components/Footer';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

type Tab = 'retouch' | 'adjust' | 'filters' | 'crop' | 'extract-text' | 'resize' | 'face-detection' | 'background';

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('AI is thinking...');
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [faces, setFaces] = useState<BoundingBox[]>([]);
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast({ message, key: Date.now() });
  };

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
    setExtractedText('');
    setFaces([]);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setExtractedText('');
    setFaces([]);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to edit.');
      return;
    }
    
    if (!prompt.trim()) {
        setError('Please enter a description for your edit.');
        return;
    }

    if (!editHotspot) {
        setError('Please click on the image to select an area to edit.');
        return;
    }

    setIsLoading(true);
    setLoadingMessage('AI is thinking...');
    setError(null);
    
    try {
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply a filter to.');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('AI is applying filter...');
    setError(null);
    
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the filter. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply an adjustment to.');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('AI is making adjustments...');
    setError(null);
    
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the adjustment. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      return Promise.reject(new Error('Failed to get canvas context'));
    }
  
    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';
  
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  
    return new Promise((resolve) => {
      resolve(canvas.toDataURL('image/png'));
    });
  }

  const handleApplyCrop = useCallback(async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
        setIsLoading(true);
        setLoadingMessage('Cropping image...');
        setError(null);
        try {
            const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
            const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
            addImageToHistory(newImageFile);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to crop the image. ${errorMessage}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }
  }, [completedCrop, addImageToHistory]);
  
  const handleApplyResize = useCallback(async (width: number, height: number) => {
    if (!imgRef.current || !currentImage) {
        setError('Image reference not found for resizing.');
        return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Resizing image...');
    setError(null);

    try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        ctx.drawImage(imgRef.current, 0, 0, width, height);

        const resizedImageUrl = canvas.toDataURL(currentImage.type || 'image/png');
        const newImageFile = dataURLtoFile(resizedImageUrl, `resized-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        showToast('Resize successful');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to resize the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [addImageToHistory, currentImage]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
      showToast('Undo successful');
      setExtractedText('');
      setFaces([]);
    }
  }, [canUndo]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
      showToast('Redo successful');
      setExtractedText('');
      setFaces([]);
    }
  }, [canRedo]);
  
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTab !== 'retouch' || !imgRef.current) return;
    
    const imageRect = imgRef.current.getBoundingClientRect();

    // Prevent setting hotspot if click is outside the actual image element.
    // This can happen due to padding or aspect ratio differences.
    if (
      e.clientX < imageRect.left ||
      e.clientX > imageRect.right ||
      e.clientY < imageRect.top ||
      e.clientY > imageRect.bottom
    ) {
      return;
    }
    
    // The wrapper div is the positioning parent for the hotspot.
    const wrapperRect = e.currentTarget.getBoundingClientRect();
    const displayX = e.clientX - wrapperRect.left;
    const displayY = e.clientY - wrapperRect.top;

    // Calculate coordinates relative to the natural image size for the AI model.
    const x = Math.round((e.clientX - imageRect.left) * (imgRef.current.naturalWidth / imageRect.width));
    const y = Math.round((e.clientY - imageRect.top) * (imgRef.current.naturalHeight / imageRect.height));
    
    setEditHotspot({ x, y });
    setDisplayHotspot({ x: displayX, y: displayY });
  };
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        setError("Please upload a valid image file.");
      }
    }
  };
  
  const handleAutoEnhance = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to enhance.');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('AI is enhancing...');
    setError(null);
    
    try {
        const enhancedImageUrl = await generateEnhancedImage(currentImage);
        const newImageFile = dataURLtoFile(enhancedImageUrl, `enhanced-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        showToast('Auto-Enhance successful');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to enhance the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleExtractText = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to extract text from.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Extracting text...');
    setError(null);
    setExtractedText('');

    try {
      const text = await extractTextFromImage(currentImage);
      setExtractedText(text);
      if (!text) {
        showToast('No text found in the image.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to extract text. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage]);
  
  const handleDetectFaces = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to detect faces in.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Detecting faces...');
    setError(null);
    setFaces([]);

    try {
      const detectedFaces = await detectFaces(currentImage);
      setFaces(detectedFaces);
      showToast(`Found ${detectedFaces.length} face(s).`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to detect faces. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage]);

  const handleRemoveBackground = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to remove background from.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Removing background...');
    setError(null);

    try {
      const resultImageUrl = await removeBackground(currentImage);
      const newImageFile = dataURLtoFile(resultImageUrl, `bg-removed-${Date.now()}.png`);
      addImageToHistory(newImageFile);
      showToast('Background removed successfully.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to remove background. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });
  };


  const imageToDisplay = isComparing ? originalImageUrl : currentImageUrl;

  if (!currentImage) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center w-full p-4">
            <StartScreen onFileSelect={handleFileSelect} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      {toast && <Toast key={toast.key} message={toast.message} onClose={() => setToast(null)} />}
      <ExportModal show={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} imageFile={currentImage} />
      
      <main className="flex-grow flex flex-col items-center p-4 md:p-8 gap-6">
        <div className="w-full max-w-7xl flex flex-col items-center gap-4">
          
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={handleUndo}
              disabled={!canUndo || isLoading}
              className="flex items-center gap-2 bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-white/10"
            >
              <UndoIcon className="w-5 h-5" />
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo || isLoading}
              className="flex items-center gap-2 bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-white/10"
            >
              Redo
              <RedoIcon className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-gray-600 mx-2"></div>

            <button
              onClick={handleAutoEnhance}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 ease-in-out shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm disabled:from-purple-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            >
              <MagicWandIcon className="w-5 h-5" />
              Auto-Enhance
            </button>
            
            <div className="h-6 w-px bg-gray-600 mx-2"></div>
            
            <button
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onMouseLeave={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
                disabled={!originalImage || originalImage === currentImage || isLoading}
                className="flex items-center gap-2 bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-white/10"
            >
              <EyeIcon className="w-5 h-5" />
              Compare
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gradient-to-br from-green-600 to-teal-500 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 ease-in-out shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm disabled:from-green-800 disabled:to-teal-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            >
              <ExportIcon className="w-5 h-5" />
              Export
            </button>
          </div>

          <div 
            className="relative w-full max-w-5xl mx-auto flex justify-center items-center"
          >
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-center items-center z-30 rounded-lg">
                  <div className="relative">
                      <Spinner />
                      <SparkleIcon className="absolute -top-2 -left-2 w-6 h-6 text-yellow-300 animate-sparkle-1" />
                      <SparkleIcon className="absolute bottom-0 right-[-10px] w-4 h-4 text-yellow-300 animate-sparkle-2" />
                      <SparkleIcon className="absolute top-1 -right-2 w-5 h-5 text-yellow-300 animate-sparkle-3" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-gray-300 animate-pulse">{loadingMessage}</p>
              </div>
            )}
            
            <div 
              className={`relative ${activeTab === 'retouch' ? 'cursor-crosshair' : ''}`}
              onClick={handleImageClick}
            >
                {activeTab === 'crop' ? (
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        aspect={aspect}
                        className="max-w-full max-h-[70vh] rounded-lg shadow-2xl shadow-black/50"
                    >
                        <img
                            ref={imgRef}
                            src={imageToDisplay!}
                            alt="Current image"
                            onLoad={onImageLoad}
                            className="max-w-full max-h-[70vh] block object-contain"
                        />
                    </ReactCrop>
                ) : (
                    <img
                        ref={imgRef}
                        src={imageToDisplay!}
                        alt="Current image"
                        onLoad={onImageLoad}
                        className="max-w-full max-h-[70vh] block object-contain rounded-lg shadow-2xl shadow-black/50"
                    />
                )}
                
                {displayHotspot && activeTab === 'retouch' && (
                    <div 
                      className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/50 border-2 border-white pointer-events-none z-10 animate-ping-once"
                      style={{ left: displayHotspot.x, top: displayHotspot.y }}
                    />
                )}
                {faces.length > 0 && activeTab === 'face-detection' && imgRef.current && (
                  faces.map((face, index) => {
                    const imageRect = imgRef.current!.getBoundingClientRect();
                    return (
                        <div
                            key={index}
                            className="absolute border-2 border-blue-400 bg-blue-500/20 rounded-md pointer-events-none"
                            style={{
                                left: `${face.x * imageRect.width}px`,
                                top: `${face.y * imageRect.height}px`,
                                width: `${face.width * imageRect.width}px`,
                                height: `${face.height * imageRect.height}px`,
                            }}
                        />
                    );
                  })
                )}
            </div>
          </div>
          
          {error && <p className="text-red-400 bg-red-900/50 border border-red-700 p-3 rounded-md text-center">{error}</p>}
          
          <div className="w-full max-w-4xl p-4 bg-gray-900/30 border border-gray-700/50 rounded-xl shadow-lg mt-4">
            <div className="flex justify-center border-b border-gray-700 flex-wrap">
                {(['retouch', 'adjust', 'filters', 'crop', 'resize', 'extract-text', 'face-detection', 'background'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        disabled={isLoading || (activeTab === 'crop' && !!completedCrop && tab !== 'crop')}
                        className={`capitalize text-lg font-semibold py-3 px-6 transition-colors duration-200 border-b-2 ${activeTab === tab ? 'text-blue-400 border-blue-400' : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>
            
            <div className="mt-6">
                {activeTab === 'retouch' && (
                     <div className="flex flex-col md:flex-row items-center gap-4 animate-fade-in">
                        <p className="text-gray-300 text-center md:text-left"><span className="font-bold text-blue-400">How to use:</span> Click on the image where you want to make an edit.</p>
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'remove the person' or 'make the shirt blue'"
                            className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full md:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isLoading || !editHotspot}
                        />
                        <button
                            onClick={handleGenerate}
                            className="w-full md:w-auto bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                            disabled={isLoading || !prompt.trim() || !editHotspot}
                        >
                            Generate Edit
                        </button>
                    </div>
                )}
                {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} />}
                {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} />}
                {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop} />}
                {activeTab === 'resize' && <ResizePanel onApplyResize={handleApplyResize} isLoading={isLoading} dimensions={imageDimensions} />}
                {activeTab === 'extract-text' && <ExtractTextPanel onExtractText={handleExtractText} isLoading={isLoading} extractedText={extractedText} />}
                {activeTab === 'face-detection' && <FaceDetectionPanel onDetectFaces={handleDetectFaces} isLoading={isLoading} faceCount={faces.length} />}
                {activeTab === 'background' && <BackgroundPanel onRemoveBackground={handleRemoveBackground} isLoading={isLoading} />}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;