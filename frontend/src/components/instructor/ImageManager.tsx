// src/components/instructor/ImageManager.tsx

import React, { useState } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImagePlus, Trash2, Loader2, AlertCircle, Users, MapPin, Image } from 'lucide-react';

interface PracticeCaseImage {
  id: number;
  image_url: string;
}

interface ImageManagerProps {
  caseId: number;
  images: PracticeCaseImage[];
  onImageUpdate: (images: PracticeCaseImage[]) => void;
}

const ImageManager: React.FC<ImageManagerProps> = ({ caseId, images, onImageUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'none' | 'scene' | 'avatar'>(images.length > 0 ? 'scene' : 'none');

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Single API call that handles generation and saving
      const response = await fetchWithAuth(`/api/practice_cases/generate_image/${caseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          include_person: imageMode === 'avatar',
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate image');
      }

      const savedImage: PracticeCaseImage = await response.json();
      
      // Replace the images array with just this one image (since we only allow one per case)
      onImageUpdate([savedImage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    const originalImages = images;
    onImageUpdate([]); // Clear the image immediately
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/practice_cases/delete_image/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        onImageUpdate(originalImages);
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      onImageUpdate(originalImages);
    }
  };

  const currentImage = images.length > 0 ? images[0] : null;

  return (
    <Card className="shadow-lg border-0 bg-white mt-6 border-l-4 border-violet-500">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ImagePlus className="h-5 w-5 text-violet-600" />
          <span>Scenario Image</span>
        </CardTitle>
        <CardDescription>
          Optionally generate a visual aid for the scenario. This image will be shown to students as they practice speaking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Controls */}
          <div className="space-y-6">
            {/* Image Generation Mode Selection */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Image Type</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className={`w-full justify-start ${
                    imageMode === 'none' 
                      ? 'bg-violet-100 border-violet-300 text-violet-800' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setImageMode('none')}
                >
                  No Image
                </Button>
                <Button
                  variant="outline"
                  className={`w-full justify-start ${
                    imageMode === 'scene' 
                      ? 'bg-violet-100 border-violet-300 text-violet-800' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setImageMode('scene')}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Scene Only
                </Button>
                <Button
                  variant="outline"
                  className={`w-full justify-start ${
                    imageMode === 'avatar' 
                      ? 'bg-violet-100 border-violet-300 text-violet-800' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setImageMode('avatar')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Scene + Character
                </Button>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                <p className="text-sm text-gray-600">
                  {imageMode === 'none' && "No visual aid for this practice case. Students will focus on the voice interaction."}
                  {imageMode === 'scene' && "Generate a realistic environment where students can imagine themselves in the scenario."}
                  {imageMode === 'avatar' && "Generate a realistic scene with a character for students to interact with visually."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {imageMode !== 'none' && (
                <Button 
                  onClick={handleGenerateImage} 
                  disabled={isGenerating || !caseId} 
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Image...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {currentImage 
                        ? `Regenerate ${imageMode === 'avatar' ? 'Scene + Character' : 'Scene'}` 
                        : `Generate ${imageMode === 'avatar' ? 'Scene + Character' : 'Scene'}`
                      }
                    </>
                  )}
                </Button>
              )}

              {currentImage && (
                <Button 
                  onClick={() => handleDeleteImage(currentImage.id)} 
                  variant="outline" 
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Image
                </Button>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Image Display */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm">
              {currentImage ? (
                <div className="relative group">
                  <div className="aspect-square rounded-xl border-2 border-gray-200 overflow-hidden bg-white shadow-lg">
                    <img 
                      src={currentImage.image_url} 
                      alt="Practice Case Scenario" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Hover overlay with delete button */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteImage(currentImage.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                  {isGenerating ? (
                    <div className="flex flex-col items-center space-y-3">
                      <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
                      <p className="text-sm font-medium text-gray-600">Generating image...</p>
                    </div>
                  ) : imageMode === 'none' ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                        <Image className="h-8 w-8 text-violet-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No Image Selected</p>
                      <p className="text-xs text-gray-400 text-center px-4">
                        Students will focus on voice interaction only
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                        {imageMode === 'avatar' ? (
                          <Users className="h-8 w-8 text-violet-500" />
                        ) : (
                          <MapPin className="h-8 w-8 text-violet-500" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-500">No Image Generated</p>
                      <p className="text-xs text-gray-400 text-center px-4">
                        Click "Generate {imageMode === 'avatar' ? 'Scene + Character' : 'Scene'}" to create an image
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageManager;