'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { ArrowLeft, FileText, ChevronLeft, ChevronRight, X, Image as ImageIcon, Calendar } from 'lucide-react'

type Measurements = {
  full_length?: string | null
  body_length?: string | null
  kurti_length?: string | null
  blouse_length?: string | null
  shoulder?: string | null
  chest?: string | null
  about?: string | null
  waist?: string | null
  stomach?: string | null
  hips?: string | null
  cut?: string | null
  gher?: string | null
  sleeve?: string | null
  front_neck?: string | null
  back_neck?: string | null
  
  full_sleeves?: { L: string | null; g: string | null } | null
  three_fourths_sleeves?: { L: string | null; g: string | null } | null
  elbow_sleeves?: { L: string | null; g: string | null } | null
  short_sleeves?: { L: string | null; g: string | null } | null
  
  pant_length?: string | null
  pant_thighs?: string | null
  pant_knee?: string | null
  pant_ankle?: string | null
}

type JobData = {
  id: string
  name: string
  status: string
  due_date: string | null
  cloth_provided_by: string
  transactions?: {
    bill_number: string
    customers?: { name: string; phone: string } | null
  } | null
}

type SpecData = {
  note: string | null
  measurements: Measurements
  image_urls: string[]
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const jobId = resolvedParams.id

  const router = useRouter()
  const supabase = createClient()

  const [job, setJob] = useState<JobData | null>(null)
  const [spec, setSpec] = useState<SpecData | null>(null)
  const [loading, setLoading] = useState(true)

  // Lightbox Modal state
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)
  const touchStart = useRef<number | null>(null)

  useEffect(() => {
    async function loadJobAndSpecs() {
      try {
        // 1. Fetch job item
        const { data: jobData, error: jobErr } = await supabase
          .from('job_items')
          .select(`
            id, name, status, due_date, cloth_provided_by,
            transactions (
              bill_number,
              customers ( name, phone )
            )
          `)
          .eq('id', jobId)
          .single()

        if (jobErr) throw jobErr
        setJob(jobData as any)

        // 2. Fetch specifications
        const { data: specData, error: specErr } = await supabase
          .from('job_specs')
          .select('*')
          .eq('job_item_id', jobId)
          .maybeSingle()

        if (specErr) throw specErr
        setSpec(specData as any)
      } catch (e) {
        console.error("Error loading job specification:", e)
      } finally {
        setLoading(false)
      }
    }

    loadJobAndSpecs()
  }, [jobId, supabase])

  // Keyboard navigation for lightbox modal
  useEffect(() => {
    if (activeImageIndex === null || !spec) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex(prev => prev === null || prev === 0 ? spec.image_urls.length - 1 : prev - 1)
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex(prev => prev === null || prev === spec.image_urls.length - 1 ? 0 : prev + 1)
      } else if (e.key === 'Escape') {
        setActiveImageIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeImageIndex, spec])

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight animate-pulse">Loading specifications...</div>
  if (!job) return <div className="p-8 text-center text-red-500">Job specification details not found.</div>

  // Get full Supabase Storage Public URL
  const getPublicUrl = (path: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-specifications/${path}`
  }

  // Lightbox carousel handlers
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeImageIndex === null || !spec) return
    setActiveImageIndex(activeImageIndex === 0 ? spec.image_urls.length - 1 : activeImageIndex - 1)
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeImageIndex === null || !spec) return
    setActiveImageIndex(activeImageIndex === spec.image_urls.length - 1 ? 0 : activeImageIndex + 1)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null || activeImageIndex === null || !spec) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart.current - touchEnd

    if (diff > 50) {
      // swipe left -> next
      setActiveImageIndex(activeImageIndex === spec.image_urls.length - 1 ? 0 : activeImageIndex + 1)
    } else if (diff < -50) {
      // swipe right -> prev
      setActiveImageIndex(activeImageIndex === 0 ? spec.image_urls.length - 1 : activeImageIndex - 1)
    }
    touchStart.current = null
  }

  const m = spec?.measurements || {}

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-boutique-border pb-4 gap-2">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-boutique-charcoal leading-tight">
            Job Specification: {job.name}
          </h1>
          <p className="text-sm text-boutique-charcoalLight mt-1">
            Bill Reference: <strong className="font-mono text-xs">#{job.transactions?.bill_number || 'N/A'}</strong>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="badge badge-indigo capitalize py-1.5 px-3 text-xs">
            Stage: {job.status}
          </span>
          <Button variant="outline" size="sm" onClick={() => router.push(`/job/${job.id}/update`)}>
            Update Stage
          </Button>
        </div>
      </div>

      {/* Trivial Specs Banner */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider block mb-1">Customer (Ref)</span>
          <p className="font-bold text-boutique-charcoal">{job.transactions?.customers?.name?.split(' ')[0] || 'Walk-in'}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider block mb-1">Target Due Date</span>
          <p className="font-bold text-boutique-charcoal flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-4 h-4 text-boutique-roseDark" />
            {job.due_date ? format(new Date(job.due_date), 'dd MMM yyyy') : 'No Due Date'}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider block mb-1">Cloth Material</span>
          <p className="font-bold text-boutique-charcoal capitalize">Cloth Provided by {job.cloth_provided_by}</p>
        </div>
      </div>

      {/* Specifications Content */}
      <div className="grid grid-cols-1 gap-6">

        {/* Measurements Card */}
        <div className="bg-white rounded-2xl border border-boutique-border shadow-card overflow-hidden">
          <div className="bg-boutique-creamDark/40 px-6 py-4 border-b border-boutique-border flex items-center gap-2">
            <FileText className="w-5 h-5 text-boutique-roseDark" />
            <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Tailoring Instruction Sheet</h3>
          </div>

          <div className="p-6 space-y-8">
            
            {/* Notes Section */}
            <div>
              <span className="block text-xs font-bold text-boutique-charcoalLight uppercase tracking-wider mb-2">
                Tailor Remarks & Instructions
              </span>
              <p className="text-sm text-boutique-charcoal bg-boutique-cream/35 p-4 rounded-lg border border-boutique-border/40 whitespace-pre-line min-h-[48px]">
                {spec?.note || <span className="text-boutique-charcoalLight italic">No remarks or custom notes added for this job.</span>}
              </p>
            </div>

            {/* General Measurements */}
            <div className="border-t border-boutique-border/60 pt-6">
              <h4 className="font-serif font-bold text-base text-boutique-charcoal mb-4">Garment Measurements</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {(['full_length', 'body_length', 'kurti_length', 'blouse_length', 'shoulder', 'chest', 'about', 'waist', 'stomach', 'hips', 'cut', 'gher', 'sleeve', 'front_neck', 'back_neck'] as const).map(field => (
                  <div key={field} className="bg-boutique-cream/10 p-3.5 border border-boutique-border/50 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-boutique-charcoalLight uppercase tracking-wider capitalize block mb-1">
                      {field.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-sm text-boutique-charcoal">
                      {m[field] ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Armhole details */}
            <div className="border-t border-boutique-border/60 pt-6">
              <h4 className="font-serif font-bold text-base text-boutique-charcoal mb-4">Armhole & Sleeves</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {(['full_sleeves', 'three_fourths_sleeves', 'elbow_sleeves', 'short_sleeves'] as const).map(sleeve => (
                  <div key={sleeve} className="bg-boutique-cream/15 p-4 border border-boutique-border/60 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-boutique-charcoal uppercase tracking-wider block">
                      {sleeve.replace('_', ' ')}
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] font-semibold text-boutique-charcoalLight uppercase block mb-1">Length (L)</span>
                        <span className="font-bold text-sm text-boutique-charcoal">
                          {m[sleeve]?.L ?? '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold text-boutique-charcoalLight uppercase block mb-1">Gher (g)</span>
                        <span className="font-bold text-sm text-boutique-charcoal">
                          {m[sleeve]?.g ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Salwar details */}
            <div className="border-t border-boutique-border/60 pt-6">
              <h4 className="font-serif font-bold text-base text-boutique-charcoal mb-4">Pant / Salwar Bottoms</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(['pant_length', 'pant_thighs', 'pant_knee', 'pant_ankle'] as const).map(field => (
                  <div key={field} className="bg-boutique-cream/10 p-3.5 border border-boutique-border/50 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-boutique-charcoalLight uppercase tracking-wider capitalize block mb-1">
                      {field.replace('pant_', '')}
                    </span>
                    <span className="font-bold text-sm text-boutique-charcoal">
                      {m[field] ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Reference Images Gallery */}
        <div className="bg-white rounded-2xl border border-boutique-border shadow-card overflow-hidden">
          <div className="bg-boutique-creamDark/40 px-6 py-4 border-b border-boutique-border flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-boutique-roseDark" />
            <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Reference Designs / Photos</h3>
          </div>

          <div className="p-6">
            {!spec || !spec.image_urls || spec.image_urls.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-boutique-border/40 text-boutique-charcoalLight text-sm italic">
                No reference design photos uploaded for this job.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 animate-fade-in">
                {spec.image_urls.map((path, idx) => (
                  <div
                    key={path}
                    className="relative group border border-boutique-border/60 rounded-xl overflow-hidden shadow-sm aspect-square bg-gray-100 cursor-pointer hover:shadow"
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getPublicUrl(path)}
                      alt={`Reference image ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Lightbox / Modal Carousel (Touch and Swipe Enabled) */}
      {activeImageIndex !== null && spec && spec.image_urls && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 select-none touch-none"
          onClick={() => setActiveImageIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-50 rounded-full bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>

          {spec.image_urls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 z-50 hidden sm:block"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 z-50 hidden sm:block"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative max-w-full max-h-[85vh] flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getPublicUrl(spec.image_urls[activeImageIndex])}
              alt={`Spec expanded reference ${activeImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain pointer-events-none rounded shadow-lg"
            />
            <span className="text-white text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-full">
              Image {activeImageIndex + 1} of {spec.image_urls.length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
