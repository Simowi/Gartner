import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function VarslingsLogg() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: logg } = await supabase
    .from('varsel_logg')
    .select('*')
    .order('opprettet_at', { ascending: false })
    .limit(20)

  return (
    <div className="max-w-xl mx-auto p-6 min-h-screen bg-gray-50 text-gray-900">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Varslingssenter</h1>
        <p className="text-gray-500 mt-2">Oversikt over råd og vær-varsler for Løvåsveien.</p>
      </header>
      
      <div className="space-y-4">
        {(!logg || logg.length === 0) ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">Ingen varsler i loggen ennå.</p>
          </div>
        ) : (
          logg.map((v) => (
            <div key={v.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg text-gray-800">{v.tittel}</h2>
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                  {new Date(v.opprettet_at).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{v.melding}</p>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-12 text-center">
        <a href="/hjem" className="inline-flex items-center text-green-600 font-semibold hover:text-green-700 transition-colors">
          <span className="mr-2">←</span> Tilbake til hagen
        </a>
      </div>
    </div>
  )
}
