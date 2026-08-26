'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Check, Clock, ArrowLeft } from 'lucide-react'

const STAGE_ORDER = [
  'ordered',
  'preparation',
  'cutting',
  'stitching',
  'finishing',
  'ironing',
  'complete',
  'delivered'
]

type JobData = {
  id: string;
  name: string;
  status: string;
  job_item_ledger: Array<{
    id: string;
    employee_id: string;
    work: string;
    changed_at: string;
    employees?: { name: string } | null;
  }>
}

type Employee = { id: string; name: string }

export default function JobWorkUpdate({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const jobId = resolvedParams.id
  
  const router = useRouter()
  const supabase = createClient()
  
  const [job, setJob] = useState<JobData | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [changedAt, setChangedAt] = useState<string>(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('job_items')
        .select(`
          id, name, status,
          job_item_ledger (
            id, employee_id, work, changed_at,
            employees ( name )
          )
        `)
        .eq('id', jobId)
        .single()

      if (error) throw error
      
      const jobData = data as any
      if (jobData?.job_item_ledger) {
        jobData.job_item_ledger.sort((a: any, b: any) =>
          new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
        )
      }
      setJob(jobData)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        await fetchJobDetails()
        
        const { data: empData, error: empErr } = await supabase
          .from('employees')
          .select('id, name')
          .order('name')
          
        if (empErr) throw empErr
        setEmployees(empData || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [jobId, supabase])

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight">Loading job details...</div>
  if (!job) return <div className="p-8 text-center text-red-500">Job not found.</div>

  const currentStageIndex = STAGE_ORDER.indexOf(job.status)
  const nextStage = job.status === 'cancelled' ? undefined : STAGE_ORDER[currentStageIndex + 1]

  const handleUpdateStatus = async () => {
    if (!nextStage) return
    if (!selectedEmployee) {
      setError("Please select the employee advancing this stage.")
      return
    }

    setUpdating(true)
    setError(null)

    try {
      // 1. Update status
      const { error: updateErr } = await supabase
        .from('job_items')
        .update({ status: nextStage })
        .eq('id', job.id)

      if (updateErr) throw new Error(updateErr.message)

      // 2. Add ledger entry
      const { error: ledgerErr } = await supabase
        .from('job_item_ledger')
        .insert({
          job_item_id: job.id,
          employee_id: selectedEmployee,
          work: nextStage,
          changed_at: new Date(changedAt).toISOString()
        })

      if (ledgerErr) throw new Error(ledgerErr.message)

      await fetchJobDetails()
      setSelectedEmployee('')
      // Reset changedAt to local now
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      setChangedAt(now.toISOString().slice(0, 16))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-boutique-charcoal leading-tight">
          Update Job: {job.name}
        </h1>
      </div>

      {/* Stage Progression UI */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 overflow-x-auto">
        <h3 className="font-serif font-bold text-lg text-boutique-charcoal mb-6">Progression Track</h3>
        <div className="flex items-center justify-between min-w-[700px] relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0 hidden md:block" />
          {STAGE_ORDER.map((stage, idx) => {
            const isCompleted = idx <= currentStageIndex
            const isCurrent = idx === currentStageIndex
            
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center">
                <div 
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm mb-2 transition-colors",
                    isCompleted ? "bg-boutique-rose text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                </div>
                <span className={clsx(
                  "text-xs font-semibold capitalize tracking-wide text-center",
                  isCurrent ? "text-boutique-rose font-bold" : "text-gray-700"
                )}>
                  {stage}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Update Job Status Section */}
        <div className="bg-boutique-creamDark rounded-xl shadow-soft border border-boutique-border p-6 space-y-4">
          <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Advance Stage</h3>
          {nextStage ? (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-md border border-boutique-border">
                <p className="text-sm text-boutique-charcoalLight">Next stage is:</p>
                <p className="font-medium text-lg text-boutique-charcoal capitalize">{nextStage}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-boutique-charcoal mb-1">Assigned Employee</label>
                <select 
                  value={selectedEmployee} 
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseLight"
                >
                  <option value="" disabled>Select the employee...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-boutique-charcoal mb-1">Date &amp; Time</label>
                <input 
                  type="datetime-local"
                  value={changedAt}
                  onChange={(e) => setChangedAt(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseLight"
                  required
                />
              </div>

              <Button 
                onClick={handleUpdateStatus} 
                className="w-full mt-4"
                disabled={!selectedEmployee || updating}
              >
                {updating ? 'Updating...' : `Advance to ${nextStage}`}
              </Button>
            </div>
          ) : job.status === 'cancelled' ? (
             <div className="p-4 bg-red-50 rounded border border-red-200 text-red-700 font-medium">
               This job has been cancelled.
             </div>
          ) : (
             <div className="p-4 bg-green-50 rounded border border-green-200 text-green-700 font-medium">
               This job has been fully delivered.
             </div>
          )}
        </div>

        {/* Ledger History */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
           <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h3 className="font-serif font-bold text-lg text-boutique-charcoal">History Log</h3>
           </div>
           {job.job_item_ledger && job.job_item_ledger.length > 0 ? (
             <div className="p-6 relative space-y-6">
                <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-gray-200 animate-slide-down"></div>
                {job.job_item_ledger.map((ledger) => (
                  <div key={ledger.id} className="relative z-10 flex gap-4">
                     <div className="w-6 h-6 rounded-full bg-boutique-roseLight flex items-center justify-center shrink-0 border border-white shadow-sm text-white relative right-1">
                        <Check className="w-3 h-3 text-white" />
                     </div>
                     <div>
                       <p className="font-medium text-sm text-boutique-charcoal capitalize">Moved to {ledger.work}</p>
                       <p className="text-xs text-boutique-charcoalLight mt-0.5">By {ledger.employees?.name || 'Unknown'}</p>
                       <p className="text-xs text-gray-600 mt-0.5">{format(new Date(ledger.changed_at), 'MMM dd, h:mm a')}</p>
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="p-6 text-center text-gray-700 text-sm">No ledger history.</div>
           )}
        </div>
      </div>
    </div>
  )
}
