import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

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
    <div className="min-h-screen bg-[#F9FAFB] pb-12">
      {/* Header / Navigasjon */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/hjem" className="text-gray-400 hover:text-green-600 transition-colors p-2 -ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">Varslingssenter</h1>
          <div className="w-10"></div> {/* Tom div for å balansere flex */}
        </div>
      </div>

      {/* Innhold */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <p className="text-sm text-gray-500 mb-6 px-2">
          Her finner du tidligere råd og værvarsler for Løvåsveien.
        </p>
        
        <div className="space-y-4">
          {(!logg || logg.length === 0) ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-4xl mb-3 opacity-50">🍃</div>
              <p className="text-gray-500 font-medium">Ingen varsler i loggen ennå.</p>
            </div>
          ) : (
            logg.map((v) => (
              <div key={v.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md relative overflow-hidden">
                {/* Liten fargeindikator til venstre */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${v.type === 'frost' ? 'bg-blue-400' : v.type === 'regn' ? 'bg-blue-600' : 'bg-green-400'}`}></div>
                
                <div className="flex justify-between items-start mb-2 pl-2">
                  <h2 className="font-semibold text-gray-800 pr-2">{v.tittel}</h2>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 whitespace-nowrap">
                    {new Date(v.opprettet_at).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed pl-2">{v.melding}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
