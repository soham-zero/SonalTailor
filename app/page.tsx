'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format, isBefore, startOfDay } from 'date-fns'
import { Search, Scissors, Clock, Calendar, CheckCircle2, User } from 'lucide-react'

type JobItem = {
  id: string
  name: string
  status: string
  due_date: string | null
  cloth_provided_by: string
  quantity: number
  amount: number | null
  charge: number
}

type Transaction = {
  id: string
  bill_number: string
  date_time: string
  status: string
  customers?: { name: string; phone: string } | null
}

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  const [billNumber, setBillNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!billNumber.trim()) return

    setLoading(true)
    setError(null)
    setTransaction(null)
    setJobs([])
    setSearched(true)

    try {
      // 1. Fetch transaction
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select(`
          id, bill_number, date_time, status,
          customers ( name, phone )
        `)
        .eq('bill_number', billNumber.trim())
        .maybeSingle()

      if (txError) throw txError
      
      if (!txData) {
        setError(`Bill #${billNumber} not found.`)
        setLoading(false)
        return
      }

      const tx = txData as any
      if (tx.status !== 'ACTIVE') {
        setError(`Bill #${billNumber} is currently ${tx.status.toLowerCase()}. Jobs are not active.`)
        setLoading(false)
        return
      }

      setTransaction(tx)

      // 2. Fetch job items that have a corresponding job_spec record
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_items')
        .select('*, job_specs!inner(id)')
        .eq('transaction_id', tx.id)
        // Show only active tailoring workload jobs
        .in('status', ['ordered', 'preparation', 'cutting', 'stitching', 'finishing', 'ironing', 'complete'])

      if (jobsError) throw jobsError

      setJobs((jobsData as any[]) || [])
    } catch (err: any) {
      console.error(err)
      setError("Failed to fetch bill details: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false
    return isBefore(startOfDay(new Date(dateString)), startOfDay(new Date()))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete': return 'badge-emerald'
      case 'stitching': return 'badge-indigo'
      case 'cutting': return 'badge-teal'
      default: return 'badge-amber'
    }
  }

  return (
    <main className="min-h-screen bg-boutique-cream py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-boutique-roseDark flex items-center justify-center shadow-md mx-auto mb-4">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-boutique-charcoal leading-tight">
            Sonal Boutique
          </h1>
          <p className="text-sm text-boutique-charcoalLight tracking-widest uppercase font-medium">
            Tailoring Workstation
          </p>
        </div>

        {/* Centered Search Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-boutique-border p-6 md:p-8 max-w-xl mx-auto">
          <h2 className="font-serif font-bold text-xl text-boutique-charcoal mb-4 text-center">
            Search Tailoring Jobs
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-boutique-charcoalLight" />
              <Input
                type="text"
                placeholder="Enter Bill Number (e.g. 101)..."
                className="pl-10 h-12 text-base font-semibold"
                value={billNumber}
                onChange={e => setBillNumber(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} size="lg" className="h-12 px-6">
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 text-center font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Search Results */}
        {searched && transaction && !error && (
          <div className="bg-white rounded-2xl shadow-soft border border-boutique-border overflow-hidden animate-fade-in">
            {/* Bill Summary Banner */}
            <div className="bg-boutique-creamDark/40 px-6 py-4 border-b border-boutique-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[10px] font-bold text-boutique-charcoalLight uppercase tracking-wider">Bill Reference</span>
                <h3 className="font-serif font-bold text-lg text-boutique-charcoal">
                  Bill #{transaction.bill_number}
                </h3>
              </div>
              <div>
                <span className="text-[10px] font-bold text-boutique-charcoalLight uppercase tracking-wider block text-left sm:text-right">Customer (Reference)</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <User className="w-4 h-4 text-boutique-roseDark" />
                  <p className="font-bold text-sm text-boutique-charcoal">
                    {transaction.customers?.name?.split(' ')[0] || 'Walk-in'}
                  </p>
                </div>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-bold text-boutique-charcoalLight uppercase tracking-wider block">Billing Date</span>
                <p className="text-sm font-semibold text-boutique-charcoal">
                  {format(new Date(transaction.date_time), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            {/* Jobs List */}
            <div className="p-6">
              <h4 className="font-serif font-bold text-base text-boutique-charcoal mb-4">
                Tailoring Jobs ({jobs.length})
              </h4>

              {jobs.length === 0 ? (
                <div className="text-center py-8 text-boutique-charcoalLight text-sm italic">
                  No active tailoring job items found for this bill.
                </div>
              ) : (
                <div className="divide-y divide-boutique-border/60 border border-boutique-border rounded-xl overflow-hidden bg-white">
                  {jobs.map((job) => {
                    const overdue = job.status !== 'complete' && isOverdue(job.due_date)
                    return (
                      <div
                        key={job.id}
                        onClick={() => router.push(`/job/${job.id}`)}
                        className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-boutique-cream/30 transition-colors cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <h5 className="font-bold text-boutique-charcoal text-base group-hover:text-boutique-roseDark transition-colors">
                            {job.name}
                          </h5>
                          <div className="flex items-center gap-3 text-xs text-boutique-charcoalLight">
                            <span className="capitalize">Cloth: <strong>{job.cloth_provided_by}</strong></span>
                            <span>•</span>
                            <span>Qty: <strong>{job.quantity}</strong></span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {/* Due Date Indicator */}
                          {job.due_date ? (
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                              overdue 
                                ? 'bg-red-50 text-red-700 border border-red-200' 
                                : 'bg-gray-50 text-boutique-charcoal border border-gray-200'
                            }`}>
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {format(new Date(job.due_date), 'dd MMM yy')}
                                {overdue && " (Overdue)"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-boutique-charcoalLight">—</span>
                          )}

                          {/* Status Badge */}
                          <span className={`badge capitalize ${getStatusBadge(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  )
}
