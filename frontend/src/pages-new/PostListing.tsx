import { useState, useRef } from 'react';
import { Camera, X, Plus, Info, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { supabaseRestInsert, supabaseStorageUpload, supabaseStoragePublicUrl } from '../lib/supabase';
import { analyzeImage, type AnalysisResult } from '../lib/imageAnalyzer';
import AddressInput from '../components/AddressInput';
import type { Category, Size, Condition, ListingMode } from '../types';

interface PostListingProps {
  onSubmit: (listingId: string) => void;
  currentUserId: string | null;
  currentUserLocation?: string;
}

export default function PostListing({ onSubmit, currentUserId, currentUserLocation }: PostListingProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'abaya' as Category,
    mode: 'rent' as ListingMode,
    size: 'M' as Size,
    condition: 'new' as Condition,
    description: '',
    location: currentUserLocation || '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    shippingAvailable: true,
    priceRentPerDay: 0,
    sellPrice: undefined as number | undefined,
    depositAmount: undefined as number | undefined,
  });

  const [images, setImages] = useState<{ file: File; preview: string; analysis?: AnalysisResult }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPanel, setAnalysisPanel] = useState<{ open: boolean; result: AnalysisResult | null; imageIndex: number }>({
    open: false,
    result: null,
    imageIndex: -1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: Category[] = ['hijab', 'abaya', 'thobe', 'dress', 'jewelry', 'decor', 'other'];
  const modes: ListingMode[] = ['buy', 'rent', 'borrow'];
  const sizes: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'one_size'];
  const conditions: Condition[] = ['new', 'like_new', 'good', 'worn'];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Calculate how many more images we can add (max 6)
    const remainingSlots = 6 - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (filesToProcess.length === 0) return;

    // Add all images to state first (without analysis)
    const newImages = filesToProcess.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      analysis: undefined as AnalysisResult | undefined
    }));

    const startIndex = images.length;
    setImages(prev => [...prev, ...newImages]);
    setIsAnalyzing(true);

    // Analyze all images in parallel
    const analyzePromises = filesToProcess.map(async (file, index) => {
      return new Promise<{ index: number; result: AnalysisResult }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = reader.result as string;
            const result = await analyzeImage(base64);
            resolve({ index: startIndex + index, result });
          } catch (err) {
            console.error('Analysis error for image', index, err);
            resolve({
              index: startIndex + index,
              result: {
                isApproved: false,
                reason: 'Analysis failed. Please try again.',
                confidence: 0,
                detectedItems: [],
                category: null,
                suggestedCategory: undefined
              }
            });
          }
        };
        reader.readAsDataURL(file);
      });
    });

    // Wait for all analyses to complete
    const results = await Promise.all(analyzePromises);

    // Update images with their analysis results
    setImages(prev => {
      const updated = [...prev];
      results.forEach(({ index, result }) => {
        if (updated[index]) {
          updated[index] = { ...updated[index], analysis: result };
        }
      });
      return updated;
    });

    // Show the first new image's analysis in the panel
    if (results.length > 0) {
      const firstResult = results[0];
      setAnalysisPanel({
        open: true,
        result: firstResult.result,
        imageIndex: firstResult.index
      });

      // Auto-set category from first approved image
      const approvedResult = results.find(r => r.result.isApproved && r.result.suggestedCategory);
      if (approvedResult?.result.suggestedCategory) {
        const suggestedCat = approvedResult.result.suggestedCategory.toLowerCase() as Category;
        if (categories.includes(suggestedCat)) {
          setFormData(prev => ({ ...prev, category: suggestedCat }));
        }
      }
    }

    setIsAnalyzing(false);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (analysisPanel.imageIndex === index) {
      setAnalysisPanel({ open: false, result: null, imageIndex: -1 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      setError('Please log in to create a listing');
      return;
    }

    // Check if any images haven't been analyzed yet
    const pendingImages = images.filter(img => !img.analysis);
    if (pendingImages.length > 0) {
      setError('Please wait for all images to be analyzed before submitting');
      return;
    }

    // Check if any images failed analysis
    const failedImages = images.filter(img => img.analysis && !img.analysis.isApproved);
    if (failedImages.length > 0) {
      setError('Please remove images that failed modesty analysis before submitting');
      return;
    }

    if (images.length === 0) {
      setError('Please add at least one image');
      return;
    }

    // Validate location is provided
    if (!formData.location || formData.location.trim() === '') {
      setError('Please provide a pickup location');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare listing data (only columns that exist in the DB)
      // NOTE: is_modest, sell_price, tags do NOT exist in the actual DB
      const listingData: Record<string, any> = {
        owner_id: currentUserId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        size: formData.size,
        condition: formData.condition,
        price_per_day: formData.mode === 'rent' ? formData.priceRentPerDay : (formData.mode === 'buy' ? (formData.sellPrice || 0) : 0),
        deposit_amount: formData.mode === 'borrow' ? formData.depositAmount : 0,
        location: formData.location,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        status: 'active',
        is_approved: true,
      };

      console.log('Creating listing with data:', listingData);

      // 1. Create the listing (direct REST — bypasses Supabase JS AbortController bug)
      const { data: listing, error: listingError } = await supabaseRestInsert('listings', listingData);

      if (listingError) {
        console.error('Listing creation error:', listingError);
        throw new Error(listingError.message || `Database error: ${listingError.code}`);
      }

      console.log('Listing created:', listing.id);

      // 2. Upload images to Supabase Storage (direct REST)
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const fileExt = img.file.name.split('.').pop();
        const filePath = `${listing.id}/${i}.${fileExt}`;

        console.log('Uploading image:', filePath);

        const { error: uploadError } = await supabaseStorageUpload('listing-images', filePath, img.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get public URL (no network call)
        const publicUrl = supabaseStoragePublicUrl('listing-images', filePath);

        // 3. Create listing_images record (direct REST)
        const { error: imageRecordError } = await supabaseRestInsert('listing_images', {
          listing_id: listing.id,
          image_url: publicUrl,
          display_order: i,
        });

        if (imageRecordError) {
          console.error('Image record error:', imageRecordError);
        }
      }

      console.log('Listing submitted successfully, redirecting...');
      onSubmit(listing.id);
    } catch (err: any) {
      console.error('Submit error:', err);
      console.error('Error name:', err.name);
      console.error('Error code:', err.code);
      console.error('Error details:', err.details);

      // Handle specific error types with user-friendly messages
      if (err.name === 'AbortError' || err.message?.includes('abort')) {
        setError('Request was interrupted. Please check your internet connection and try again.');
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.code === '23502') {
        // NOT NULL violation
        setError('Please fill in all required fields (title, description, category, condition, location).');
      } else if (err.code === '23503') {
        // Foreign key violation
        setError('Your session may have expired. Please refresh and try again.');
      } else {
        setError(err.message || 'Failed to create listing. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12 relative">
      {/* Analysis Side Panel */}
      {analysisPanel.open && analysisPanel.result && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-hairline">
          <div className="p-6 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-rose" />
              <span className="text-[11px] uppercase tracking-widest font-bold">AI Analysis</span>
            </div>
            <button
              onClick={() => setAnalysisPanel({ open: false, result: null, imageIndex: -1 })}
              className="p-1 hover:bg-beige rounded"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status */}
            <div className={`p-4 rounded-lg ${analysisPanel.result.isApproved ? 'bg-forest/10' : 'bg-rose/10'}`}>
              <div className="flex items-center gap-3 mb-2">
                {analysisPanel.result.isApproved ? (
                  <CheckCircle className="text-forest" size={24} />
                ) : (
                  <XCircle className="text-rose" size={24} />
                )}
                <span className="text-[14px] font-bold uppercase tracking-wider">
                  {analysisPanel.result.isApproved ? 'Approved' : 'Not Approved'}
                </span>
              </div>
              <p className="text-[12px] text-espresso/70 leading-relaxed">
                {analysisPanel.result.reason}
              </p>
            </div>

            {/* Confidence */}
            <div>
              <span className="text-[9px] uppercase tracking-widest font-bold text-espresso/40">Confidence</span>
              <div className="mt-2 h-2 bg-beige rounded-full overflow-hidden">
                <div
                  className={`h-full ${analysisPanel.result.isApproved ? 'bg-forest' : 'bg-rose'}`}
                  style={{ width: `${(analysisPanel.result.confidence || 0) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-espresso/60 mt-1 block">
                {Math.round((analysisPanel.result.confidence || 0) * 100)}%
              </span>
            </div>

            {/* Detected Items */}
            {analysisPanel.result.detectedItems && analysisPanel.result.detectedItems.length > 0 && (
              <div>
                <span className="text-[9px] uppercase tracking-widest font-bold text-espresso/40">Detected Items</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {analysisPanel.result.detectedItems.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-beige text-[10px] uppercase tracking-widest">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Category */}
            {analysisPanel.result.suggestedCategory && (
              <div>
                <span className="text-[9px] uppercase tracking-widest font-bold text-espresso/40">Suggested Category</span>
                <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-rose">
                  {analysisPanel.result.suggestedCategory}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-hairline">
            <button
              onClick={() => setAnalysisPanel({ open: false, result: null, imageIndex: -1 })}
              className="w-full bg-espresso text-white py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-rose transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-serif uppercase tracking-widest">Post a New Piece</h1>
        <p className="text-rose font-script text-2xl">Share your wardrobe</p>
        <div className="w-12 h-[1px] bg-hairline mx-auto mt-6"></div>
      </div>

      {error && (
        <div className="mb-8 bg-rose/10 border border-rose/30 text-rose text-[11px] px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left: Photos */}
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold">Product Photos</label>

            {/* Main upload area */}
            {images.length === 0 ? (
              <label className="aspect-[3/4] bg-white border border-dashed border-hairline flex flex-col items-center justify-center space-y-4 cursor-pointer hover:bg-beige transition-colors group">
                <div className="p-4 bg-beige border border-hairline group-hover:border-rose/40">
                  <Camera size={32} strokeWidth={1} className="text-espresso/40" />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] uppercase tracking-widest font-bold">Add up to 6 photos</span>
                  <span className="block text-[8px] uppercase tracking-widest text-espresso/40 mt-1">
                    AI will analyze for modesty compliance
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="aspect-[3/4] bg-white border border-hairline overflow-hidden relative">
                <img
                  src={images[0].preview}
                  alt="Main"
                  className="w-full h-full object-cover"
                />
                {images[0].analysis && (
                  <div className={`absolute top-4 right-4 px-3 py-1 text-[8px] uppercase tracking-widest font-bold ${images[0].analysis.isApproved ? 'bg-forest text-white' : 'bg-rose text-white'
                    }`}>
                    {images[0].analysis.isApproved ? 'Approved' : 'Rejected'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(0)}
                  className="absolute top-4 left-4 p-1 bg-white/80 hover:bg-white rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Thumbnail grid */}
            <div className="grid grid-cols-4 gap-4">
              {images.slice(1).map((img, i) => (
                <div key={i + 1} className="aspect-square bg-white border border-hairline overflow-hidden relative">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  {img.analysis && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${img.analysis.isApproved ? 'bg-forest' : 'bg-rose'
                      }`} />
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i + 1)}
                    className="absolute top-1 right-1 p-0.5 bg-white/80 hover:bg-white rounded-full"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {images.length < 6 && images.length > 0 && (
                <label className="aspect-square bg-white border border-hairline flex items-center justify-center cursor-pointer hover:bg-beige transition-colors">
                  {isAnalyzing ? (
                    <Loader2 size={16} className="animate-spin text-rose" />
                  ) : (
                    <Plus size={16} className="text-hairline" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isAnalyzing}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="p-6 bg-forest/5 border border-forest/10 space-y-4">
            <div className="flex items-center space-x-2">
              <Info size={16} className="text-forest" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-forest">AI Modesty Check</span>
            </div>
            <p className="text-[11px] text-forest/70 leading-relaxed">
              Our AI analyzes each image to ensure it meets modest fashion standards.
              Only approved items can be listed on Kloset Kifayah.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Vintage Chiffon Hijab in Dusk"
                className="w-full bg-transparent border-b border-hairline py-3 text-sm focus:outline-none focus:border-espresso transition-colors font-serif text-xl"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Category</label>
                <select
                  className="w-full bg-white border border-hairline p-3 text-[11px] uppercase tracking-widest focus:outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Mode</label>
                <select
                  className="w-full bg-white border border-hairline p-3 text-[11px] uppercase tracking-widest focus:outline-none"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as ListingMode })}
                >
                  {modes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">
                {formData.mode === 'buy' ? 'Selling Price ($)' : formData.mode === 'rent' ? 'Daily Rate ($)' : 'Refundable Deposit ($)'}
              </label>
              <input
                type="number"
                required
                placeholder="0.00"
                className="w-full bg-white border border-hairline p-3 text-sm focus:outline-none"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (formData.mode === 'buy') setFormData({ ...formData, sellPrice: val });
                  else if (formData.mode === 'rent') setFormData({ ...formData, priceRentPerDay: val });
                  else setFormData({ ...formData, depositAmount: val });
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Size</label>
                <select
                  className="w-full bg-white border border-hairline p-3 text-[11px] uppercase tracking-widest focus:outline-none"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value as Size })}
                >
                  {sizes.map(s => <option key={s} value={s}>{s === 'one_size' ? 'One Size' : s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Condition</label>
                <select
                  className="w-full bg-white border border-hairline p-3 text-[11px] uppercase tracking-widest focus:outline-none"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as Condition })}
                >
                  {conditions.map(c => <option key={c} value={c}>{c === 'like_new' ? 'Like New' : c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Description</label>
              <textarea
                rows={4}
                required
                placeholder="Describe the fabric, fit, and any special features..."
                className="w-full bg-white border border-hairline p-4 text-[12px] focus:outline-none focus:border-rose transition-colors leading-relaxed"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Pickup Location</label>
              <AddressInput
                value={formData.location}
                onChange={(addr, lat, lng) => setFormData({
                  ...formData,
                  location: addr,
                  latitude: lat,
                  longitude: lng
                })}
                required
              />
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-bold">Shipping Available</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, shippingAvailable: !formData.shippingAvailable })}
                  className={`w-12 h-6 border border-hairline relative transition-colors ${formData.shippingAvailable ? 'bg-forest' : 'bg-white'}`}
                >
                  <div className={`absolute top-0.5 h-4.5 w-4.5 bg-white border border-hairline transition-all ${formData.shippingAvailable ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              images.length === 0 ||
              isAnalyzing ||
              images.some(img => !img.analysis) ||  // Any pending analysis
              images.some(img => img.analysis && !img.analysis.isApproved)  // Any failed
            }
            className="w-full bg-espresso text-white py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-rose transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {images.length === 0 ? 'Add Photos to Post' :
              images.some(img => !img.analysis) ? 'Analyzing Images...' :
                images.some(img => img.analysis && !img.analysis.isApproved) ? 'Remove Rejected Images' :
                  'Post Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
