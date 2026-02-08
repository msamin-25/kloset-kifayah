import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListingCategory, ListingCondition, CategoryDisplayNames } from '../types';
import { analyzeImage, type AnalysisResult } from '../lib/imageAnalyzer';

interface ListingFormData {
    title: string;
    description: string;
    category: ListingCategory;
    brand: string;
    size: string;
    color: string;
    condition: ListingCondition;
    price_per_day: string;
    sell_price: string;
    min_rental_days: string;
    max_rental_days: string;
    deposit_amount: string;
    location: string;
    is_modest: boolean;
    is_cleaned: boolean;
    is_smoke_free: boolean;
    is_pet_free: boolean;
    women_only_pickup: boolean;
    tags: string;
}

interface ImageWithAnalysis {
    dataUrl: string;
    analysis: AnalysisResult | null;
    analyzing: boolean;
}

export default function CreateListingPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<ImageWithAnalysis[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<ListingFormData>({
        title: '',
        description: '',
        category: ListingCategory.ABAYA,
        brand: '',
        size: '',
        color: '',
        condition: ListingCondition.GOOD,
        price_per_day: '',
        sell_price: '',
        min_rental_days: '1',
        max_rental_days: '14',
        deposit_amount: '',
        location: '',
        is_modest: false,
        is_cleaned: false,
        is_smoke_free: false,
        is_pet_free: false,
        women_only_pickup: false,
        tags: '',
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (!event.target?.result) return;

                const dataUrl = event.target.result as string;

                // Add image with analyzing state
                const newImage: ImageWithAnalysis = {
                    dataUrl,
                    analysis: null,
                    analyzing: true
                };

                setImages(prev => [...prev, newImage]);
                const imageIndex = images.length; // This index might be stale if multiple added quickly, but loop sequential

                // Analyze the image
                try {
                    console.log('Starting analysis for image...');
                    const analysis = await analyzeImage(dataUrl);
                    console.log('Analysis result:', analysis);

                    setImages(prev => prev.map((img) =>
                        img.dataUrl === dataUrl
                            ? { ...img, analysis, analyzing: false }
                            : img
                    ));

                    // Auto-fill category if detected
                    if (analysis.isApproved && analysis.suggestedCategory && !formData.title) {
                        const categoryMap: Record<string, ListingCategory> = {
                            'abaya': ListingCategory.ABAYA,
                            'hijab': ListingCategory.HIJAB,
                            'thobe': ListingCategory.THOBE,
                            'niqab': ListingCategory.NIQAB,
                            'dress': ListingCategory.EVENT_WEAR,
                            'gown': ListingCategory.EVENT_WEAR,
                            'jewelry': ListingCategory.JEWELRY,
                            'accessories': ListingCategory.JEWELRY,
                            'decor': ListingCategory.DECOR,
                            'prayer': ListingCategory.PRAYER_ITEMS,
                            'kids': ListingCategory.KIDS,
                            'other': ListingCategory.OTHER,
                        };
                        const mappedCategory = categoryMap[analysis.suggestedCategory.toLowerCase()];
                        if (mappedCategory) {
                            setFormData(prev => ({ ...prev, category: mappedCategory }));
                        }
                        if (analysis.isModest !== undefined) {
                            setFormData(prev => ({ ...prev, is_modest: analysis.isModest || false }));
                        }
                    }
                } catch (error) {
                    console.error('Analysis failed:', error);
                    setImages(prev => prev.map((img) =>
                        img.dataUrl === dataUrl
                            ? { ...img, analyzing: false, analysis: { isApproved: true, detectedItems: [], category: null, confidence: 0, reason: 'Analysis skipped due to error' } }
                            : img
                    ));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const hasRejectedImages = images.some(img => img.analysis && !img.analysis.isApproved);
    const isAnalyzing = images.some(img => img.analyzing);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (hasRejectedImages) {
            alert('Please remove rejected images before submitting.');
            return;
        }

        if (isAnalyzing) {
            alert('Please wait for image analysis to complete.');
            return;
        }

        setSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        alert('Listing created successfully! (Demo mode - in production this would save to the database)');
        navigate('/profile');
    };

    const updateField = (field: keyof ListingFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <div className="bg-white border-b border-stone-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            to="/profile"
                            className="inline-flex items-center space-x-2 text-stone-600 hover:text-stone-900 transition-colors font-medium"
                        >
                            <i className="fa-solid fa-arrow-left"></i>
                            <span>Back</span>
                        </Link>
                        <h1 className="text-xl font-bold text-stone-900">Create Listing</h1>
                        <div className="w-20"></div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Image Upload */}
                <div className="bg-white rounded-3xl p-8 shadow-sm mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-stone-900">Photos</h2>
                        <div className="flex items-center space-x-2 text-sm bg-stone-50 px-3 py-1.5 rounded-full border border-stone-100">
                            <i className="fa-solid fa-robot text-amber-600 animate-pulse"></i>
                            <span className="text-stone-600 font-medium">AI Content Moderation Active</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 group">
                                <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />

                                {/* Analyzing overlay */}
                                {img.analyzing && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm z-20">
                                        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
                                        <span className="text-xs font-bold uppercase tracking-wider animate-pulse">Analyzing...</span>
                                    </div>
                                )}

                                {/* Analysis result badge */}
                                {img.analysis && !img.analyzing && (
                                    <div className={`absolute top-2 left-2 right-2 px-3 py-2 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md flex items-start space-x-2 z-10 transition-all ${img.analysis.isApproved
                                            ? 'bg-emerald-500/90 text-white'
                                            : 'bg-red-500/90 text-white'
                                        }`}>
                                        <i className={`fa-solid ${img.analysis.isApproved ? 'fa-check-circle' : 'fa-times-circle'} mt-0.5 text-sm`}></i>
                                        <div className="flex-1">
                                            <span className="block text-sm mb-0.5">{img.analysis.isApproved ? 'Approved' : 'Rejected'}</span>
                                            {/* Show reason on hover for approved, always for rejected */}
                                            <p className={`font-normal leading-tight text-[10px] ${img.analysis.isApproved ? 'hidden group-hover:block' : 'block'}`}>
                                                {img.analysis.reason}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Detected items */}
                                {img.analysis?.isApproved && img.analysis.detectedItems.length > 0 && !img.analyzing && (
                                    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 z-10">
                                        {img.analysis.detectedItems.slice(0, 3).map((item, i) => (
                                            <span key={i} className="bg-stone-900/80 backdrop-blur text-white text-[10px] px-2 py-1 rounded-full font-medium">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 w-8 h-8 bg-white/20 hover:bg-red-500 backdrop-blur text-white rounded-full flex items-center justify-center transition-all z-20"
                                >
                                    <i className="fa-solid fa-times"></i>
                                </button>

                                {idx === 0 && img.analysis?.isApproved && (
                                    <div className="absolute bottom-2 left-2 bg-amber-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider z-10 shadow-lg">
                                        Cover
                                    </div>
                                )}
                            </div>
                        ))}

                        {images.length < 8 && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 hover:border-amber-500 hover:text-amber-600 transition-all hover:bg-amber-50 group"
                            >
                                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
                                    <i className="fa-solid fa-camera text-2xl text-stone-300 group-hover:text-amber-500 transition-colors"></i>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider">Add Photo</span>
                            </button>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                    />

                    <div className="flex items-start space-x-3 text-sm bg-stone-50 p-4 rounded-2xl border border-stone-100">
                        <i className="fa-solid fa-info-circle text-amber-600 mt-0.5 text-lg"></i>
                        <div className="text-stone-500">
                            <p className="font-bold text-stone-700 mb-1">Image Guidelines</p>
                            <p>Add up to 8 photos. First approved photo will be the cover.</p>
                            <p className="mt-1">Our AI analyzes each image to ensure it meets our marketplace guidelines for modest fashion. Please ensure images are clear and items are modest.</p>
                        </div>
                    </div>

                    {hasRejectedImages && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 animate-in slide-in-from-top-2">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-exclamation-triangle text-red-500"></i>
                            </div>
                            <div>
                                <p className="font-bold text-red-700">Action Required</p>
                                <p className="text-sm text-red-600">Some images were rejected by our moderation system. Please remove them to continue.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-3xl p-8 shadow-sm mb-8">
                    <h2 className="text-lg font-bold text-stone-900 mb-6">Basic Information</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">Title *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="e.g., Royal Silk Abaya"
                                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">Description</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                placeholder="Describe your item in detail..."
                                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Category *</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => updateField('category', e.target.value)}
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white"
                                >
                                    {Object.values(ListingCategory).map(cat => (
                                        <option key={cat} value={cat}>{CategoryDisplayNames[cat] || cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Condition *</label>
                                <select
                                    required
                                    value={formData.condition}
                                    onChange={(e) => updateField('condition', e.target.value)}
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white"
                                >
                                    <option value={ListingCondition.LIKE_NEW}>Like New</option>
                                    <option value={ListingCondition.GOOD}>Good</option>
                                    <option value={ListingCondition.FAIR}>Fair</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Brand</label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => updateField('brand', e.target.value)}
                                    placeholder="e.g., Zara, Gucci"
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Size</label>
                                <input
                                    type="text"
                                    value={formData.size}
                                    onChange={(e) => updateField('size', e.target.value)}
                                    placeholder="e.g., S, M, L, XL"
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Color</label>
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) => updateField('color', e.target.value)}
                                    placeholder="e.g., Black, Navy, Cream"
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Location *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={(e) => updateField('location', e.target.value)}
                                    placeholder="e.g., Toronto, ON"
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">Tags</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => updateField('tags', e.target.value)}
                                placeholder="Separate tags with commas: formal, silk, wedding"
                                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-3xl p-8 shadow-sm mb-8">
                    <h2 className="text-lg font-bold text-stone-900 mb-6">Pricing</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">Rent Price ($/day) *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="0.01"
                                    value={formData.price_per_day}
                                    onChange={(e) => updateField('price_per_day', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">Sell Price ($) - Optional</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={formData.sell_price}
                                    onChange={(e) => updateField('sell_price', e.target.value)}
                                    placeholder="Leave empty if not for sale"
                                    className="w-full pl-8 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">Deposit Amount ($)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.deposit_amount}
                                    onChange={(e) => updateField('deposit_amount', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Min Days</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.min_rental_days}
                                    onChange={(e) => updateField('min_rental_days', e.target.value)}
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Max Days</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.max_rental_days}
                                    onChange={(e) => updateField('max_rental_days', e.target.value)}
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Options */}
                <div className="bg-white rounded-3xl p-8 shadow-sm mb-8">
                    <h2 className="text-lg font-bold text-stone-900 mb-6">Item Options</h2>

                    <div className="space-y-4">
                        {[
                            { field: 'is_modest' as const, label: 'Modest/Islamic Collection', desc: 'This item is suitable for the modest collection', icon: 'fa-star-and-crescent' },
                            { field: 'is_cleaned' as const, label: 'Professionally Cleaned', desc: 'Item has been professionally dry cleaned', icon: 'fa-sparkles' },
                            { field: 'is_smoke_free' as const, label: 'Smoke-Free Home', desc: 'Item comes from a smoke-free environment', icon: 'fa-ban-smoking' },
                            { field: 'is_pet_free' as const, label: 'Pet-Free Home', desc: 'Item comes from a pet-free environment', icon: 'fa-paw' },
                            { field: 'women_only_pickup' as const, label: 'Women-Only Pickup', desc: 'Only women can pick up this item', icon: 'fa-venus' },
                        ].map(opt => (
                            <label key={opt.field} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData[opt.field] as boolean}
                                    onChange={(e) => updateField(opt.field, e.target.checked)}
                                    className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500 mt-0.5"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <i className={`fa-solid ${opt.icon} text-amber-600 text-sm`}></i>
                                        <span className="font-bold text-stone-900">{opt.label}</span>
                                    </div>
                                    <p className="text-sm text-stone-500">{opt.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end space-x-4">
                    <Link
                        to="/profile"
                        className="px-8 py-4 rounded-full font-bold text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting || hasRejectedImages || isAnalyzing || images.length === 0}
                        className="px-12 py-4 bg-amber-700 hover:bg-amber-800 text-white rounded-full font-bold uppercase tracking-wider text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Creating...' : isAnalyzing ? 'Analyzing Images...' : 'Create Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
}
