import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Clock,
  Users,
  Activity,
  Sparkles,
  Instagram,
  Globe,
  Edit3,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpDown,
  Film,
  Video,
  Play,
  Lock,
} from 'lucide-react';
import {
  Recipe,
  RecipeCategory,
  RecipeFormData,
  RecipeNutrition,
  Ingredient,
  RecipeStep,
} from '../../types/recipe';
import { calculateRecipeNutrition } from '../../services/nutritionService';
import { useAuth } from '../../context/AuthContext';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts keyframes from uploaded reel video using HTML5 video + canvas
 * to enable fast, reliable AI extraction for any video size.
 */
async function extractVideoKeyframes(videoFile: File, maxFrames = 8): Promise<{
  coverDataUrl: string;
  frames: Array<{ data: string; mimeType: string }>;
}> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(videoFile);
    video.src = url;

    video.onloadedmetadata = async () => {
      const duration = video.duration || 10;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxDim = 720;
      let w = video.videoWidth || 640;
      let h = video.videoHeight || 480;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;

      const timestamps: number[] = [];
      const step = duration / (maxFrames + 1);
      for (let i = 1; i <= maxFrames; i++) {
        timestamps.push(Math.min(duration - 0.5, Math.max(0.5, i * step)));
      }

      const frames: Array<{ data: string; mimeType: string }> = [];
      let coverDataUrl = '';

      for (let i = 0; i < timestamps.length; i++) {
        const time = timestamps[i];
        await new Promise<void>((resSeek) => {
          video.currentTime = time;
          video.onseeked = () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, w, h);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
              if (i === 0 || i === Math.floor(timestamps.length / 2)) {
                if (!coverDataUrl || i === Math.floor(timestamps.length / 2)) {
                  coverDataUrl = dataUrl;
                }
              }
              const base64Only = dataUrl.split(',')[1] || '';
              frames.push({ data: base64Only, mimeType: 'image/jpeg' });
            }
            resSeek();
          };
        });
      }

      URL.revokeObjectURL(url);
      resolve({
        coverDataUrl: coverDataUrl || (frames[0]?.data ? `data:image/jpeg;base64,${frames[0].data}` : ''),
        frames,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ coverDataUrl: '', frames: [] });
    };
  });
}

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  recipeToEdit?: Recipe | null;
  onUpdate?: (id: string, data: RecipeFormData) => Promise<void>;
}

type ModalTab = 'manual' | 'website' | 'instagram';

// Sample demonstration websites for immediate 1-click testing
const SAMPLE_WEBSITES = [
  {
    label: '🍝 Carbonara (GialloZafferano)',
    url: 'https://ricette.giallozafferano.it/Spaghetti-alla-Carbonara.html',
  },
  {
    label: '🍨 Tiramisù (GialloZafferano)',
    url: 'https://ricette.giallozafferano.it/Tiramisu.html',
  },
  {
    label: '🍅 Bruschette al Pomodoro',
    url: 'https://ricette.giallozafferano.it/Bruschette-al-pomodoro.html',
  },
];

// Sample demonstration reels for immediate 1-click testing
const SAMPLE_REELS = [
  {
    label: '🧀 Pasta Patate e Provola',
    url: 'https://www.instagram.com/reel/C-PastaPatateDemo/',
    caption: `PASTA PATATE E PROVOLA cremosissima e filante! 🤤🧀
Salva il reel per non perderla!

Per 4 persone:
- 350g di pasta mista
- 500g di patate
- 200g di provola affumicata
- 100g di pancetta
- 1 carota
- 1 costa di sedano
- 1/2 cipolla
- 50g di parmigiano grattugiato
- scorza di parmigiano
- olio evo, sale e pepe q.b.
- 1 rametto di rosmarino

Procedimento:
1. In una pentola prepariamo il soffritto con olio, cipolla, carota e sedano tritati e la pancetta.
2. Aggiungiamo le patate tagliate a cubetti piccoli e facciamo rosolare per qualche minuto.
3. Copriamo con brodo caldo, aggiungiamo la scorza di parmigiano e il rosmarino e lasciamo cuocere per circa 20 minuti finché le patate non saranno tenere.
4. Schiacciamo una parte delle patate con una forchetta per renderla cremosa, poi caliamo la pasta direttamente nella pentola allungando con poca acqua calda se serve.
5. Quando la pasta è cotta al dente, spegniamo il fuoco, uniamo la provola a cubetti e il parmigiano e mescoliamo energicamente per farla filare. Servire calda con un pizzico di pepe!`,
  },
  {
    label: '🍝 Gramigna alla Salsiccia',
    url: 'https://www.instagram.com/reel/C-GramignaDemo/',
    caption: `GRAMIGNA ALLA SALSICCIA
Questa è come la fa il mio papino, ed è spettacolare ✨
Ps. Se vi piace aggiungete del pepe (la mia salsiccia era già bella pepata)

INGREDIENTI:
250 g gramigna
200 g panna da cucina
1 cucchiaino di concentrato di pomodoro
2 salsicce
1 noce di burro
Sale qb

+ SE VI PIACE, mantecate con del parmigiano 🧀

PROCEDIMENTO NEL VIDEO ✨`,
  },
  {
    label: '🍎 Torta di Mele Soffice',
    url: 'https://www.instagram.com/reel/C-TortaMeleDemo/',
    caption: `TORTA DI MELE SOFFICE DELLA NONNA 🍎
Si scioglie in bocca!

INGREDIENTI:
🍏 3 mele
🧁 300g farina 00
🥚 3 uova
🧈 100g burro fuso
🥛 150ml latte
🍚 180g zucchero
✨ 1 bustina di lievito per dolci
🍋 scorza di un limone grattugiata
Cannella q.b.

PREPARAZIONE:
1. Sbuccia le mele e tagliale a fettine sottili con succo di limone e cannella.
2. Monta le uova con lo zucchero fino a renderle chiare e spumose.
3. Aggiungi il burro fuso e il latte a filo mescolando a bassa velocità.
4. Unisci la farina setacciata con il lievito e la scorza di limone.
5. Versa l'impasto in una tortiera da 24cm imburrata e decora con le fettine di mela a raggiera.
6. Inforna a 180°C statico per circa 40-45 minuti.`,
  },
];

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  recipeToEdit,
  onUpdate,
}) => {
  const { user } = useAuth();
  const userEmail = (user?.email || user?.user_metadata?.email || '').toLowerCase().trim();
  const isApiAuthorized = userEmail === 'devmars.mb@gmail.com';
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ModalTab>('manual');

  // Instagram extraction state
  const [reelUrl, setReelUrl] = useState('');
  const [reelRawText, setReelRawText] = useState('');
  const [reelScreenshot, setReelScreenshot] = useState<string | null>(null);
  const [reelScreenshotName, setReelScreenshotName] = useState<string>('');
  const [reelVideoFile, setReelVideoFile] = useState<File | null>(null);
  const [reelVideoPreview, setReelVideoPreview] = useState<string | null>(null);
  const [reelVideoName, setReelVideoName] = useState<string>('');
  const [extractingStepStatus, setExtractingStepStatus] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);
  const [extractionSource, setExtractionSource] = useState<'website' | 'instagram' | null>(null);

  // Website extraction state
  const [webUrl, setWebUrl] = useState('');
  const [webRawText, setWebRawText] = useState('');
  const [isExtractingWeb, setIsExtractingWeb] = useState(false);
  const [webExtractStatus, setWebExtractStatus] = useState('');
  const [sourceType, setSourceType] = useState<'manual' | 'instagram' | 'website'>('manual');

  // Form Fields (Editable Review Form)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('Primi');
  const [prepTime, setPrepTime] = useState('30 min');
  const [servings, setServings] = useState(4);
  const [sourceUrl, setSourceUrl] = useState('');
  const [ingredients, setIngredients] = useState<{ name: string; amount: string }[]>([
    { name: '', amount: '' },
    { name: '', amount: '' },
  ]);
  const [steps, setSteps] = useState<string[]>(['', '']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  // Submit and Nutrition state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewNutrition, setPreviewNutrition] = useState<RecipeNutrition | null>(null);
  const [isCalculatingPreview, setIsCalculatingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Video selection handler: extracts thumbnail and sets preview
  const handleVideoSelected = async (file: File) => {
    if (reelVideoPreview) {
      URL.revokeObjectURL(reelVideoPreview);
    }
    setReelVideoFile(file);
    setReelVideoName(file.name);
    const previewUrl = URL.createObjectURL(file);
    setReelVideoPreview(previewUrl);
    setErrorMsg('');

    try {
      const { coverDataUrl } = await extractVideoKeyframes(file, 2);
      if (coverDataUrl) {
        setReelScreenshot(coverDataUrl);
        setReelScreenshotName(`Fotogramma da ${file.name}`);
      }
    } catch (e) {
      console.warn('Errore anteprima cover da video:', e);
    }
  };

  const handleRemoveVideo = () => {
    if (reelVideoPreview) {
      URL.revokeObjectURL(reelVideoPreview);
    }
    setReelVideoFile(null);
    setReelVideoPreview(null);
    setReelVideoName('');
  };

  const handleTabClick = (tab: ModalTab) => {
    if (tab === 'instagram' && !isApiAuthorized) {
      setLockedNotice(
        'Questa funzionalità non è accessibile, puoi inserire la tua ricetta manualmente o tramite Link Web!'
      );
      return;
    }
    setLockedNotice(null);
    setActiveTab(tab);
  };

  // Reset or pre-populate when modal opens/closes or recipeToEdit changes
  useEffect(() => {
    if (isOpen) {
      setLockedNotice(null);
      if (activeTab === 'instagram' && !isApiAuthorized) {
        setActiveTab('manual');
      }
      if (recipeToEdit) {
        setActiveTab('manual');
        setTitle(recipeToEdit.title);
        setCategory(recipeToEdit.category);
        setPrepTime(recipeToEdit.prep_time || '30 min');
        setServings(recipeToEdit.servings || 4);
        setSourceUrl(recipeToEdit.source_url || '');
        setIngredients(
          recipeToEdit.ingredients && recipeToEdit.ingredients.length > 0
            ? recipeToEdit.ingredients.map((i: Ingredient) => ({ name: i.name, amount: i.amount }))
            : [{ name: '', amount: '' }]
        );
        setSteps(
          recipeToEdit.steps && recipeToEdit.steps.length > 0
            ? recipeToEdit.steps.map((s: RecipeStep) => s.instruction)
            : ['']
        );
        setImageUrl(recipeToEdit.image_url || '');
        setImagePreview(recipeToEdit.image_url || null);
        setImageFile(null);
        setSourceType(recipeToEdit.source_type || (recipeToEdit.source_url?.includes('instagram.com') ? 'instagram' : recipeToEdit.source_url ? 'website' : 'manual'));
        setExtractionSource(null);
        setPreviewNutrition(recipeToEdit.nutrition || null);
        setErrorMsg('');
        setIsSubmitting(false);
        setIsExtracting(false);
        setIsExtractingWeb(false);
        setExtractionSuccess(false);
        setReelVideoFile(null);
        setReelVideoPreview(null);
        setReelVideoName('');
        setExtractingStepStatus('');
      } else {
        setActiveTab('manual');
        setReelUrl('');
        setReelRawText('');
        setReelScreenshot(null);
        setReelScreenshotName('');
        setReelVideoFile(null);
        if (reelVideoPreview) URL.revokeObjectURL(reelVideoPreview);
        setReelVideoPreview(null);
        setReelVideoName('');
        setExtractingStepStatus('');
        setWebUrl('');
        setWebRawText('');
        setWebExtractStatus('');
        setIsExtracting(false);
        setIsExtractingWeb(false);
        setExtractionSuccess(false);
        setExtractionSource(null);
        setSourceType('manual');

        setTitle('');
        setCategory('Primi');
        setPrepTime('30 min');
        setServings(4);
        setSourceUrl('');
        setIngredients([
          { name: '', amount: '' },
          { name: '', amount: '' },
        ]);
        setSteps(['', '']);
        setImageFile(null);
        setImagePreview(null);
        setImageUrl('');
        setErrorMsg('');
        setIsSubmitting(false);
        setPreviewNutrition(null);
        setIsCalculatingPreview(false);
      }
    }
  }, [isOpen, recipeToEdit]);

  // Clipboard paste listener: paste screenshot image directly!
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'instagram') return;
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setReelScreenshot(event.target?.result as string);
                setReelScreenshotName('Screenshot incollato dagli appunti');
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !isExtracting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isExtracting, onClose]);

  if (!isOpen) return null;

  // Handle local image file
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Per favore carica un file immagine valido (JPG, PNG, WebP).');
      return;
    }
    setErrorMsg('');
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Dynamic ingredient handlers
  const addIngredientRow = () => {
    setIngredients((prev) => [...prev, { name: '', amount: '' }]);
  };

  const updateIngredient = (index: number, field: 'name' | 'amount', value: string) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    setPreviewNutrition(null);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((_, idx) => idx !== index));
    setPreviewNutrition(null);
  };

  // Dynamic step handlers
  const addStepRow = () => {
    setSteps((prev) => [...prev, '']);
  };

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Reorder ingredients into sensible culinary sequence: bases -> complementaries/liquids -> cheeses/fats -> seasonings/aromatics
  const handleSortIngredientsCulinary = () => {
    const getScore = (ing: { name: string; amount: string }) => {
      const text = `${ing.name} ${ing.amount}`.toLowerCase();
      if (
        text.includes('q.b.') ||
        text.includes('qb') ||
        text.includes('sale') ||
        text.includes('pepe') ||
        text.includes('cacao') ||
        text.includes('spezie') ||
        text.includes('aromi') ||
        text.includes('origano') ||
        text.includes('rosmarino') ||
        text.includes('basilico') ||
        text.includes('prezzemolo') ||
        text.includes('timo') ||
        text.includes('salvia') ||
        text.includes('noce moscata') ||
        text.includes('cannella') ||
        text.includes('vaniglia')
      ) {
        return 40;
      }
      if (
        text.includes('pecorino') ||
        text.includes('parmigiano') ||
        text.includes('grana') ||
        text.includes('provola') ||
        text.includes('mozzarella') ||
        text.includes('formaggio') ||
        text.includes('burro') ||
        text.includes('olio') ||
        text.includes('strutto') ||
        text.includes('scorza')
      ) {
        return 30;
      }
      if (
        text.includes('panna') ||
        text.includes('zucchero') ||
        text.includes('caffè') ||
        text.includes('caffe') ||
        text.includes('latte') ||
        text.includes('vino') ||
        text.includes('pomodoro') ||
        text.includes('concentrato') ||
        text.includes('passata') ||
        text.includes('pelati') ||
        text.includes('brodo') ||
        text.includes('cipolla') ||
        text.includes('carota') ||
        text.includes('sedano') ||
        text.includes('aglio') ||
        text.includes('scalogno') ||
        text.includes('verdura') ||
        text.includes('funghi') ||
        text.includes('zucchine')
      ) {
        return 20;
      }
      return 10;
    };

    setIngredients((prev) => [...prev].sort((a, b) => getScore(a) - getScore(b)));
  };

  // Reorder steps chronologically: prep -> sauté/browning -> sauce/liquids -> cooking base -> mantecatura -> plating
  const handleSortStepsCulinary = () => {
    const getStepScore = (step: string) => {
      const lower = step.toLowerCase();
      if (lower.includes('impiatt') || lower.includes('servire') || lower.includes('decorare') || lower.includes('finitura')) {
        return 60;
      }
      if (lower.includes('manteca') || lower.includes('filare') || lower.includes('scolare la pasta') || lower.includes('saltare') || lower.includes('unire la provola') || lower.includes('unire il parmigiano')) {
        return 50;
      }
      if (lower.includes('cuocere la pasta') || lower.includes('calare la pasta') || lower.includes('tuffare la pasta') || lower.includes('inforna') || lower.includes('risottare')) {
        return 40;
      }
      if (lower.includes('brodo') || lower.includes('panna') || lower.includes('concentrato') || lower.includes('pomodoro') || lower.includes('sugo') || lower.includes('sobbollire') || lower.includes('coprire con')) {
        return 30;
      }
      if (lower.includes('rosolare') || lower.includes('soffrigg') || lower.includes('dorare') || lower.includes('far sciogliere') || lower.includes('scaldare la padella')) {
        return 20;
      }
      // Preparation, cutting, weighing, chopping
      return 10;
    };

    setSteps((prev) => [...prev].sort((a, b) => getStepScore(a) - getStepScore(b)));
  };

  // Trigger automatic scraping from cooking website
  const handleExtractWeb = async () => {
    setErrorMsg('');
    if (!webUrl.trim() && !webRawText.trim()) {
      setErrorMsg('Inserisci un URL valido di un sito web di cucina o incolla il testo della ricetta.');
      return;
    }

    setIsExtractingWeb(true);
    setWebExtractStatus('Recupero ricetta ed estrazione automatica...');

    try {
      const statusTimer = setTimeout(() => {
        setWebExtractStatus('Analisi ingredienti, dosi e passaggi di preparazione...');
      }, 600);

      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({
          url: webUrl.trim(),
          source_type: 'website',
          rawText: webRawText.trim() || undefined,
          userEmail,
        }),
      });

      clearTimeout(statusTimer);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Impossibile estrarre la ricetta dal sito web indicato.');
      }

      const extracted = json.data;

      // PRE-POPULATE THE EDITABLE FORM FOR 100% REVISION
      setTitle(extracted.title || '');
      setCategory(extracted.category || 'Primi');
      setPrepTime(extracted.prep_time || '30 min');
      setServings(extracted.servings || 4);
      setSourceUrl(extracted.source_url || webUrl.trim());
      setSourceType('website');

      if (extracted.image_url) {
        setImageUrl(extracted.image_url);
        setImagePreview(extracted.image_url);
        setImageFile(null);
      }

      if (Array.isArray(extracted.ingredients) && extracted.ingredients.length > 0) {
        setIngredients(extracted.ingredients);
      }

      if (Array.isArray(extracted.steps) && extracted.steps.length > 0) {
        setSteps(extracted.steps);
      }

      setExtractionSuccess(true);
      setExtractionSource('website');

      // CORE UX: Automatically switch to the editable review form
      setActiveTab('manual');

      // Pre-calculate nutrition in background
      try {
        const nut = await calculateRecipeNutrition(
          extracted.ingredients.map((ing: any, idx: number) => ({
            id: `ing-${idx}`,
            name: ing.name,
            amount: ing.amount,
          })),
          extracted.servings || 4
        );
        setPreviewNutrition(nut);
      } catch (e) {
        // quiet fallback
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Errore durante l\'estrazione della ricetta dal sito.');
    } finally {
      setIsExtractingWeb(false);
      setWebExtractStatus('');
    }
  };

  // Trigger AI extraction from Instagram Reel or direct video
  const handleExtractReel = async () => {
    setErrorMsg('');
    if (!reelUrl.trim() && !reelRawText.trim() && !reelScreenshot && !reelVideoFile) {
      setErrorMsg('Inserisci il link del Reel, carica il file video, oppure incolla la caption.');
      return;
    }

    setIsExtracting(true);
    setExtractingStepStatus('Avvio elaborazione del Reel...');

    try {
      let videoBase64: string | undefined = undefined;
      let videoKeyframes: Array<{ data: string; mimeType: string }> | undefined = undefined;
      let coverImageToUse = reelScreenshot || undefined;

      if (reelVideoFile) {
        setExtractingStepStatus('Estrazione fotogrammi chiave ad alta definizione dal video...');
        try {
          const { coverDataUrl, frames } = await extractVideoKeyframes(reelVideoFile, 8);
          videoKeyframes = frames;
          if (coverDataUrl && !coverImageToUse) {
            coverImageToUse = coverDataUrl;
            setReelScreenshot(coverDataUrl);
          }
        } catch (kfErr) {
          console.warn('Errore estrazione keyframes:', kfErr);
        }

        // If file is reasonable (< 18MB), send full video file base64 as well
        if (reelVideoFile.size <= 18 * 1024 * 1024) {
          setExtractingStepStatus('Codifica video per analisi diretta con Flash-Lite...');
          try {
            videoBase64 = await fileToDataUrl(reelVideoFile);
          } catch (e) {
            console.warn('Fallback a soli fotogrammi:', e);
          }
        }

        setExtractingStepStatus('Analisi del video ed estrazione ordinata di ingredienti e passaggi...');
      } else if (reelRawText.trim()) {
        setExtractingStepStatus('Elaborazione rapida della didascalia con riordino ingredienti e passaggi...');
      } else {
        setExtractingStepStatus('Ricerca ed estrazione strutturata della ricetta dal Reel...');
      }

      const res = await fetch('/api/extract-reel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({
          url: reelUrl.trim(),
          rawText: reelRawText.trim(),
          imageBase64: coverImageToUse,
          videoBase64,
          videoMimeType: reelVideoFile?.type,
          videoKeyframes,
          userEmail,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Estrazione AI non riuscita. Riprova o incolla la caption.');
      }

      const extracted = json.data;

      // PRE-POPULATE THE EDITABLE FORM
      setTitle(extracted.title || '');
      setCategory(extracted.category || 'Primi');
      setPrepTime(extracted.prep_time || '25 min');
      setServings(extracted.servings || (extracted.title?.toLowerCase().includes('gramigna') ? 2 : 4));
      setSourceUrl(extracted.source_url || reelUrl.trim());
      setSourceType('instagram');

      const chosenImage = extracted.image_url || coverImageToUse || '';
      if (chosenImage) {
        setImageUrl(chosenImage);
        setImagePreview(chosenImage);
        setImageFile(null);
      }

      if (Array.isArray(extracted.ingredients) && extracted.ingredients.length > 0) {
        setIngredients(extracted.ingredients);
      }

      if (Array.isArray(extracted.steps) && extracted.steps.length > 0) {
        setSteps(extracted.steps);
      }

      setExtractionSuccess(true);
      setExtractionSource('instagram');

      // Automatically switch to the editable review form
      setActiveTab('manual');

      // Pre-calculate nutrition in background
      try {
        const nut = await calculateRecipeNutrition(
          extracted.ingredients.map((ing: any, idx: number) => ({
            id: `ing-${idx}`,
            name: ing.name,
            amount: ing.amount,
          })),
          extracted.servings || 4
        );
        setPreviewNutrition(nut);
      } catch (e) {
        // quiet fallback
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Errore durante l\'estrazione AI del Reel.');
    } finally {
      setIsExtracting(false);
      setExtractingStepStatus('');
    }
  };

  const handleCalculatePreview = async () => {
    const validIngredients = ingredients
      .filter((i) => i.name.trim() !== '')
      .map((ing, idx) => ({
        id: `prev-${idx}`,
        name: ing.name.trim(),
        amount: ing.amount.trim() || '100g',
      }));

    if (validIngredients.length === 0) {
      setErrorMsg('Inserisci almeno un ingrediente per calcolare i valori nutrizionali.');
      return;
    }

    setIsCalculatingPreview(true);
    setErrorMsg('');
    try {
      const nut = await calculateRecipeNutrition(validIngredients, Number(servings) || 4);
      setPreviewNutrition(nut);
    } catch (err) {
      console.warn('Errore anteprima nutrizionale:', err);
    } finally {
      setIsCalculatingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Inserisci il titolo della ricetta.');
      return;
    }

    const validIngredients = ingredients.filter((i) => i.name.trim() !== '');
    if (validIngredients.length === 0) {
      setErrorMsg('Aggiungi almeno un ingrediente con il suo nome.');
      return;
    }

    const validSteps = steps.filter((s) => s.trim() !== '');
    if (validSteps.length === 0) {
      setErrorMsg('Aggiungi almeno un passaggio di preparazione.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: RecipeFormData = {
        title: title.trim(),
        category,
        prep_time: prepTime.trim() || '30 min',
        servings: Number(servings) || 4,
        source_url: sourceUrl.trim() || undefined,
        source_type: sourceType,
        image_url: imageUrl.trim() || (imagePreview && !imageFile ? imagePreview : undefined),
        imageFile: imageFile,
        ingredients: validIngredients,
        steps: validSteps,
      };

      if (recipeToEdit && onUpdate) {
        await onUpdate(recipeToEdit.id, payload);
      } else {
        await onSubmit(payload);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Si è verificato un errore durante il salvataggio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !isExtracting && !isExtractingWeb) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Mode Selection Tabs */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial text-xl font-bold text-stone-900">
              {recipeToEdit
                ? 'Modifica Ricetta'
                : extractionSuccess
                ? 'Revisione Ricetta Pre-Salvataggio'
                : 'Nuova Ricetta'}
            </h2>
            <p className="text-xs text-stone-500">
              {recipeToEdit
                ? 'Modifica ingredienti, dosi e passaggi, poi salva le modifiche nel ricettario'
                : extractionSuccess
                ? 'Modifica e personalizza al 100% tutti i dati estratti prima di salvare'
                : 'Scegli la modalità di inserimento che preferisci'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!recipeToEdit && (
              <div className="inline-flex p-1 bg-stone-200/80 rounded-xl text-xs font-semibold gap-1">
                {/* Manual Tab: Always active and accessible for everyone */}
                <button
                  type="button"
                  onClick={() => handleTabClick('manual')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'manual'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#990f4b]" />
                  <span>{extractionSuccess ? 'Revisione' : 'Manuale'}</span>
                </button>

                {/* Link Web Tab: 100% Free HTML scraping without API, unlocked for all users */}
                <button
                  type="button"
                  onClick={() => handleTabClick('website')}
                  title="Importa ricetta da qualsiasi sito web di cucina"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'website'
                      ? 'bg-[#990f4b] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 ${activeTab === 'website' ? 'text-white' : 'text-sky-500'}`} />
                  <span>Link Web</span>
                </button>

                {/* Reel Tab: Unlocked for devmars.mb@gmail.com, locked with padlock for everyone else */}
                <button
                  type="button"
                  onClick={() => handleTabClick('instagram')}
                  title={
                    isApiAuthorized
                      ? 'Importa ricetta da Instagram Reel con IA'
                      : 'Questa funzionalità non è accessibile'
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isApiAuthorized
                      ? activeTab === 'instagram'
                        ? 'bg-[#990f4b] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                      : 'opacity-70 text-stone-500 bg-stone-100/70 border border-stone-300/60 hover:bg-stone-200/70'
                  }`}
                >
                  {isApiAuthorized ? (
                    <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>Reel</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isExtracting || isExtractingWeb}
              className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informational notice when clicking locked API tabs */}
        {lockedNotice && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span>{lockedNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setLockedNotice(null)}
              className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-[#990f4b] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Notification Banner when extracted from Web or Instagram */}
        {extractionSuccess && activeTab === 'manual' && (
          <div className="mx-6 mt-4 p-3 text-xs rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">
                {extractionSource === 'website'
                  ? 'Ricetta estratta dal sito web con successo!'
                  : 'Ricetta estratta da Instagram con successo!'}
              </span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Tutti i campi sono stati pre-caricati nel form sottostante. Sei nella schermata di <strong>revisione totale pre-salvataggio</strong>: puoi modificare qualsiasi testo, cambiare categoria, sostituire la foto o modificare/eliminare ogni singolo ingrediente e passaggio prima di salvare su Supabase.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: IMPORT FROM COOKING WEBSITE */}
        {/* ========================================================= */}
        {activeTab === 'website' && (
          <div className="overflow-y-auto flex-1 p-6 space-y-5 animate-in fade-in duration-150">
            <div className="p-4 bg-linear-to-br from-sky-50/80 via-[#faf7f7] to-amber-50/50 rounded-2xl border border-sky-200/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-sky-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial text-base font-bold text-stone-900">
                    Import da Sito Web di Cucina (es. GialloZafferano, Cookist)
                  </h3>
                  <p className="text-xs text-stone-600">
                    Estrae automaticamente foto ad alta risoluzione, titolo, porzioni, ingredienti con dosi e passaggi di preparazione.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Websites buttons */}
            <div>
              <span className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-2">
                Prova subito con un link di esempio:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_WEBSITES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setWebUrl(sample.url);
                      setErrorMsg('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{sample.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Web URL Input */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Incolla il link della pagina web della ricetta <span className="text-[#990f4b]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Globe className="w-4 h-4 text-sky-600" />
                  </div>
                  <input
                    type="url"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    placeholder="https://ricette.giallozafferano.it/Spaghetti-alla-Carbonara.html"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Testo o ingredienti della ricetta <span className="text-stone-400 font-normal">(opzionale, utile se il sito ha protezioni anti-bot o richiede login)</span>
                </label>
                <textarea
                  rows={3}
                  value={webRawText}
                  onChange={(e) => setWebRawText(e.target.value)}
                  placeholder="Se il sito blocca la lettura automatica, puoi incollare qui ingredienti e testo..."
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                />
              </div>

              <p className="text-[11px] text-stone-500">
                Supporta l'estrazione diretta senza errori da Schema.org Recipe (JSON-LD), Microdata e pagine web culinarie.
              </p>
            </div>

            {/* Extract Web Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-stone-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#990f4b]" />
                I dati estratti verranno mostrati nel form modificabile prima del salvataggio.
              </span>

              <button
                type="button"
                onClick={handleExtractWeb}
                disabled={isExtractingWeb || (!webUrl.trim() && !webRawText.trim())}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isExtractingWeb ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{webExtractStatus || 'Analisi della ricetta in corso...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Estrai Ricetta dal Sito Web</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: IMPORT FROM INSTAGRAM REEL / VIDEO */}
        {/* ========================================================= */}
        {activeTab === 'instagram' && (
          <div className="overflow-y-auto flex-1 p-6 space-y-5 animate-in fade-in duration-150">
            <div className="p-4 bg-linear-to-br from-pink-50/70 via-[#faf7f7] to-amber-50/50 rounded-2xl border border-pink-200/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial text-base font-bold text-stone-900">
                    Estrazione Diretta da Instagram Reel e Video
                  </h3>
                  <p className="text-xs text-stone-600">
                    Estrae fedelmente e riordina ingredienti, dosi e tutti i passaggi di preparazione dal Reel. Utilizza elaborazione locale ad alta efficienza o il modello leggero Flash-Lite per ridurre al minimo i consumi.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Reels buttons */}
            <div>
              <span className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-2">
                Prova con 1 click un esempio:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_REELS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setReelUrl(sample.url);
                      setReelRawText(sample.caption);
                      setErrorMsg('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-pink-50/80 hover:bg-pink-100/90 text-stone-800 border border-pink-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{sample.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* METHOD 1: Video File Upload (DIRECT EXTRACTION FROM VIDEO) */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#990f4b]" />
                  <span>Metodo 1: Carica il File Video del Reel (.mp4, .mov, .webm)</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Analisi Video Flash-Lite
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Se hai salvato o registrato il video del Reel, caricalo qui: l'intelligenza artificiale esamina i fotogrammi e il parlato per estrapolare tutti gli ingredienti esatti e le fasi di preparazione.
              </p>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleVideoSelected(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {reelVideoPreview ? (
                <div className="space-y-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="relative rounded-lg overflow-hidden bg-black/95 max-h-56 flex items-center justify-center">
                    <video
                      src={reelVideoPreview}
                      controls
                      playsInline
                      className="w-full max-h-56 object-contain"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-pink-100 text-[#990f4b] flex items-center justify-center">
                        <Play className="w-4 h-4 fill-[#990f4b]" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-stone-900 block truncate max-w-xs">
                          {reelVideoName || 'Video Reel caricato'}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          Video pronto per l'estrazione AI di dosi e passaggi
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
                      title="Rimuovi video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#d27f87]/50 hover:border-[#990f4b] rounded-xl p-5 text-center bg-[#faf7f7]/60 hover:bg-pink-50/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-pink-100/80 text-[#990f4b] flex items-center justify-center shadow-2xs">
                    <Video className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">
                      Clicca o trascina qui il file video del Reel
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      Supporta file MP4, MOV, WebM. L'AI estrarrà ingredienti, grammature e passaggi dal video.
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* METHOD 2: Reel URL Input */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
              <label className="block text-xs font-bold text-stone-900">
                Metodo 2: Link URL del Reel di Instagram
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Instagram className="w-4 h-4 text-pink-600" />
                </div>
                <input
                  type="url"
                  value={reelUrl}
                  onChange={(e) => setReelUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Gemini cercherà online i dettagli del video e della ricetta associata al Reel per estrapolare ingredienti e procedimento completi.
              </p>
            </div>

            {/* METHOD 3: Caption Text Area (Optional) */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-[#990f4b]" />
                  <span>Metodo 3: Incolla la Caption del Reel (Opzionale)</span>
                </label>
                <span className="text-[10px] text-stone-400">Opzionale</span>
              </div>
              <p className="text-xs text-stone-500">
                Se il Reel ha testo descrittivo o dosi nella didascalia, incollalo qui per aiutare l'elaborazione.
              </p>
              <textarea
                rows={3}
                value={reelRawText}
                onChange={(e) => setReelRawText(e.target.value)}
                placeholder="Incolla qui la caption copiata dal Reel...&#10;Es. PASTA PATATE E PROVOLA: 350g pasta, 500g patate..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
              />
            </div>

            {/* METHOD 4: Screenshot upload / paste */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#990f4b]" />
                  <span>Metodo 4: Screenshot o Foto del piatto (Opzionale)</span>
                </label>
                <span className="text-[10px] text-stone-400 font-mono">Supporta Incolla Ctrl+V</span>
              </div>
              <p className="text-xs text-stone-500">
                Carica una foto del piatto o lo screenshot del Reel da usare come copertina della ricetta.
              </p>

              <input
                ref={screenshotInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setReelScreenshot(event.target?.result as string);
                      setReelScreenshotName(file.name);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />

              {reelScreenshot ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img
                      src={reelScreenshot}
                      alt="Screenshot Reel"
                      className="w-14 h-14 object-cover rounded-lg border border-emerald-300 shadow-2xs"
                    />
                    <div>
                      <span className="text-xs font-semibold text-emerald-900 block">
                        Immagine di copertina acquisita
                      </span>
                      <span className="text-[11px] text-emerald-700 truncate block max-w-xs">
                        {reelScreenshotName || 'Copertina impostata'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReelScreenshot(null);
                      setReelScreenshotName('');
                    }}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Rimuovi immagine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => screenshotInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-stone-300 hover:border-[#990f4b] rounded-xl p-3.5 text-center hover:bg-stone-50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <Upload className="w-4 h-4 text-stone-400" />
                  <span className="text-xs font-medium text-stone-700">
                    Clicca o trascina qui una foto oppure premi Ctrl+V
                  </span>
                </button>
              )}
            </div>

            {/* Extract Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-stone-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#990f4b]" />
                Tutti i dati estratti verranno mostrati nella scheda modificabile prima del salvataggio.
              </span>

              <button
                type="button"
                onClick={handleExtractReel}
                disabled={isExtracting || (!reelUrl.trim() && !reelRawText.trim() && !reelScreenshot && !reelVideoFile)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{extractingStepStatus || 'Analisi del video in corso con Gemini...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Estrai Ricetta dal Video / Reel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: EDITABLE PRE-SAVE REVIEW FORM (CORE FEATURE) */}
        {/* ========================================================= */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
            {/* Source Reel Banner if imported */}
            {sourceUrl && (
              <div className="p-3 bg-pink-50/70 border border-pink-200/70 rounded-xl flex items-center justify-between gap-3 text-xs text-stone-700">
                <div className="flex items-center gap-2 min-w-0">
                  <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                  <span className="font-semibold text-stone-900 shrink-0">Origine Reel:</span>
                  <span className="truncate text-stone-600">{sourceUrl}</span>
                </div>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#990f4b] hover:underline shrink-0"
                >
                  <span>Apri</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Titolo della Ricetta <span className="text-[#990f4b]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. Risotto ai Funghi Porcini"
                  className="cursor-recipe-input caret-[#990f4b] w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-300 rounded-lg text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Categoria <span className="text-[#990f4b]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                  className="w-full px-3 py-2.5 bg-stone-50/50 border border-stone-300 rounded-lg text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                >
                  <option value="Antipasti">Antipasti</option>
                  <option value="Primi">Primi</option>
                  <option value="Secondi">Secondi</option>
                  <option value="Dolci">Dolci</option>
                </select>
              </div>
            </div>

            {/* Time & Servings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#c05f72]" /> Tempo di Preparazione
                  </span>
                </label>
                <input
                  type="text"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="es. 30 min, 1h 15m"
                  className="w-full px-3 py-2 bg-stone-50/50 border border-stone-300 rounded-lg text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#c05f72]" /> Porzioni
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-stone-50/50 border border-stone-300 rounded-lg text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                />
              </div>
            </div>

            {/* Image Upload Slot with Preview and Drag & Drop */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  Immagine della Ricetta (Thumbnail Reel o Foto Personale)
                </label>
                <span className="text-[11px] text-stone-400">
                  Puoi sostituirla o caricarne una dal tuo dispositivo
                </span>
              </div>

              {imagePreview || imageUrl ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 group">
                  <img
                    src={imagePreview || imageUrl}
                    alt="Anteprima"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setImageUrl('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold shadow hover:bg-red-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Rimuovi
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white text-stone-800 text-xs font-semibold shadow hover:bg-stone-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Carica dal dispositivo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-[#990f4b] bg-[#faf7f7]'
                      : 'border-stone-300 hover:border-[#d27f87] bg-stone-50/40'
                  }`}
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-[#990f4b] mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-stone-700">
                    Trascina un'immagine qui oppure{' '}
                    <span className="text-[#990f4b] underline">sfoglia i file</span>
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Supporta JPG, PNG, WebP (Verrà caricata automaticamente su Supabase Storage)
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {/* Optional URL input toggle */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-stone-400">oppure URL immagine:</span>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  placeholder="https://..."
                  className="flex-1 px-2.5 py-1 text-xs border border-stone-200 rounded-md bg-stone-50/30 focus:bg-white focus:outline-none focus:border-[#990f4b]"
                />
              </div>
            </div>

            {/* Dynamic Ingredients Section */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div>
                  <label className="text-xs font-semibold text-stone-800">
                    Ingredienti e Dosi Ordinate <span className="text-[#990f4b]">*</span>
                  </label>
                  <span className="block text-[11px] text-stone-400">
                    Tutti gli ingredienti inseriti con ordine logico (dosi separate da ingredienti)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSortIngredientsCulinary}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                    title="Riordina per basi, complementi e condimenti"
                  >
                    <ArrowUpDown className="w-3 h-3 text-[#990f4b]" />
                    <span>Riordina</span>
                  </button>
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#990f4b] hover:text-[#ad3d5e] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Aggiungi
                  </button>
                </div>
              </div>

              {/* Table Column Labels */}
              <div className="flex items-center gap-2 mb-1 px-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                <span className="flex-3">Nome Ingrediente</span>
                <span className="flex-2">Dose / Quantità</span>
                <span className="w-8"></span>
              </div>

              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                      placeholder={`Ingrediente ${idx + 1} (es. Guanciale, Spaghetti)`}
                      className="flex-3 px-3 py-2 text-xs bg-stone-50/50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#990f4b] focus:border-[#990f4b]"
                    />
                    <input
                      type="text"
                      value={ing.amount}
                      onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                      placeholder="Dose (es. 150g, 4 tuorli)"
                      className="flex-2 px-3 py-2 text-xs bg-stone-50/50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#990f4b] focus:border-[#990f4b]"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      disabled={ingredients.length <= 1}
                      className="p-2 text-stone-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                      title="Rimuovi ingrediente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Nutrition Calculation Preview */}
              <div className="mt-3 p-3 bg-stone-50/80 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#990f4b]" />
                    <span>Stima Nutrizionale Dinamica</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCalculatePreview}
                    disabled={isCalculatingPreview}
                    className="px-2.5 py-1 text-[11px] font-semibold text-[#990f4b] hover:bg-[#990f4b]/10 rounded border border-[#d27f87]/40 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isCalculatingPreview ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>{previewNutrition ? 'Ricalcola' : 'Anteprima Calorie con API'}</span>
                  </button>
                </div>

                {previewNutrition ? (
                  <div className="mt-2.5 pt-2 border-t border-stone-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                    <div className="p-2 bg-white rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-400 block">Calorie totali</span>
                      <strong className="text-[#990f4b] text-sm">
                        {previewNutrition.calories} kcal
                      </strong>
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        (~{Math.round(previewNutrition.calories / (servings || 4))} kcal / porz.)
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-400 block">Proteine</span>
                      <strong className="text-emerald-700 text-sm">
                        {previewNutrition.macros.proteins}g
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-400 block">Carboidrati</span>
                      <strong className="text-amber-700 text-sm">
                        {previewNutrition.macros.carbohydrates}g
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-400 block">Grassi totali</span>
                      <strong className="text-[#990f4b] text-sm">
                        {previewNutrition.macros.fats}g
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500 mt-1">
                    I valori nutrizionali completi e le calorie verranno calcolati automaticamente non appena salvi la ricetta.
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Preparation Steps Section */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <label className="text-xs font-semibold text-stone-800">
                    Passaggi di Preparazione <span className="text-[#990f4b]">*</span>
                  </label>
                  <span className="block text-[11px] text-stone-400">
                    Verifica l'ordine dei passaggi, correggi o aggiungi dettagli
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSortStepsCulinary}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                    title="Riordina i passaggi secondo la sequenza logica di preparazione e cottura"
                  >
                    <ArrowUpDown className="w-3 h-3 text-[#990f4b]" />
                    <span>Riordina passaggi</span>
                  </button>
                  <button
                    type="button"
                    onClick={addStepRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#990f4b] hover:text-[#ad3d5e] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Aggiungi passaggio
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {steps.map((stepText, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-stone-50/60 p-2.5 rounded-xl border border-stone-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#990f4b] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                      {idx + 1}
                    </div>
                    <textarea
                      rows={2}
                      value={stepText}
                      onChange={(e) => updateStep(idx, e.target.value)}
                      placeholder={`Descrivi il passaggio ${idx + 1}...`}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#990f4b] focus:border-[#990f4b] resize-y"
                    />
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                        title="Sposta in alto"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 'down')}
                        disabled={idx === steps.length - 1}
                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                        title="Sposta in basso"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        disabled={steps.length <= 1}
                        className="p-1 text-stone-400 hover:text-red-600 disabled:opacity-20 cursor-pointer"
                        title="Elimina passaggio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-2 pt-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{recipeToEdit ? 'Salvataggio modifiche...' : 'Salvataggio su Supabase...'}</span>
                  </>
                ) : (
                  <span>{recipeToEdit ? 'Salva Modifiche' : 'Salva Ricetta nel Ricettario'}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
