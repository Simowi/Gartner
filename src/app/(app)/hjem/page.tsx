'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Droplets, Leaf, Sun, Sparkles, Bell } from 'lucide-react'
import PushVarsler from '@/components/PushVarsler'
import VærStripe from '@/components/VærStripe'
import DagligMelding from '@/components/DagligMelding'
import Minneskrin from '@/components/Minneskrin'
import HjemStatistikk from '@/components/HjemStatistikk'
import Sesongkort from '@/components/Sesongkort'
import Plantegalleri from '@/components/Plantegalleri'
import DeltAktivitet from '@/components/DeltAktivitet'
import InspoGalleri from '@/components/InspoGalleri'

interface Plante {
  id: string
  navn: string
  art: string
  neste_vanning: string
  bilde_url: string
  vanning_intervall_dager: number
}

interface TipsKort {
  type: 'tips' | 'fakta'
  tekst: string
}

function hentNavn(epost: string): string {
  if (epost === 'oda.v.lunder@gmail.com') return 'Oda'
  if (epost === 'sivertmw@gmail.com') return 'Sivert'
  return epost.split('@')[0]
}

function hentHilsen(navn: string): string {
  const time = new Date().getHours()
  if (time >= 5 && time < 10) return 'God morgen, ' + navn + '!'
  if (time >= 10 && time < 13) return 'God formiddag, ' + navn + '!'
  if (time >= 13 && time < 17) return 'God ettermiddag, ' + navn + '!'
  if (time >= 17 && time < 22) return 'God kveld, ' + navn + '!'
  return 'God natt, ' + navn + '!'
}

const tips: TipsKort[] = [
  { type: 'tips', tekst: 'Stikk fingeren 2–3 cm ned i jorda før du vanner – er det fremdeles fuktig, kan du vente litt til.' },
  { type: 'tips', tekst: 'Tørk støv av bladene jevnlig med en fuktig klut. Støvete blader fotosyntiserer dårligere.' },
  { type: 'tips', tekst: 'La kranvann stå i en time før vanning – da fordamper klor og kalken synker til bunns.' },
  { type: 'tips', tekst: 'De fleste stueplanter liker temperaturer mellom 18 og 24 °C og misliker kuldetrekk.' },
  { type: 'tips', tekst: 'Vann sjeldnere om vinteren – de fleste planter har en naturlig hvileperiode fra oktober til februar.' },
  { type: 'tips', tekst: 'Flytt planter gradvis til ny plassering – la dem stå halvdager på gammel og ny plass de første dagene.' },
  { type: 'tips', tekst: 'Planter som strekker seg skjevt mot lyset mangler lyseksponering. Flytt dem nærmere vinduet.' },
  { type: 'tips', tekst: 'Hell vannet direkte i jorda, ikke på bladene – vann på bladene kan gi soppvekst.' },
  { type: 'tips', tekst: 'Gjødsl bare i vekstsesongen (mars–september). Om vinteren trenger planten hvile, ikke næring.' },
  { type: 'tips', tekst: 'Gule blader kan bety for mye vann. Brune bladspisser tyder ofte på for lite luftfuktighet.' },
  { type: 'tips', tekst: 'Sett planter i grupper for å øke luftfuktigheten rundt dem – plantene skaper et eget mikroklima.' },
  { type: 'tips', tekst: 'Under de mørkeste vintermånedene kan du sette planter under kjøkkenbenken med lysrør over.' },
  { type: 'tips', tekst: 'Pott om planten når røttene begynner å vokse ut av dreneringshullene i bunnen av potten.' },
  { type: 'tips', tekst: 'Bruk alltid potter med dreneringshull – stillestående vann i bunnen er den vanligste årsaken til råtne røtter.' },
  { type: 'tips', tekst: 'Beskjær gullranke og pothos om våren for å stimulere til frodig og tett ny vekst.' },
  { type: 'tips', tekst: 'Sjekk undersiden av bladene jevnlig – skadedyr som spinnmidd og bladlus gjemmer seg gjerne der.' },
  { type: 'tips', tekst: 'Neemolje blandet med vann er et effektivt og naturlig middel mot de fleste vanlige skadedyr på stueplanter.' },
  { type: 'tips', tekst: 'En ny plante bør få stå i ro noen uker før du begynner å flytte og styre med den – la den tilpasse seg.' },
  { type: 'tips', tekst: 'Kaktuser og sukkulenter tåler uttørking langt bedre enn overvanning. Tørr jord er sjelden et problem for dem.' },
  { type: 'tips', tekst: 'Legg et lag med leca-kuler i bunnen av potten for bedre drenering og luftig rotmiljø.' },
  { type: 'tips', tekst: 'Orkidéen bør ha om lag ett eggeglass med vann i uka – og aldri stå med røttene i stillestående vann.' },
  { type: 'tips', tekst: 'En plante som plutselig mister mange blader kan ha fått sjokk av kulde, trekk eller brå lysendring.' },
  { type: 'tips', tekst: 'Vårens første solstråler er kraftigere enn vinterlyset – flytt lysskye planter litt vekk fra vinduet i mars–april.' },
  { type: 'tips', tekst: 'Klipp av visne blomster raskt – da bruker planten energien på ny blomstring fremfor frøproduksjon.' },
  { type: 'tips', tekst: 'Regelmessig gjødsling gir planten næring til å leve i mange år. Uten gjødsel tømmes jorda for næring over tid.' },
  { type: 'fakta', tekst: 'Monstera deliciosa er opprinnelig fra regnskogene i Mellom-Amerika og kan i naturen bli opptil 20 meter høy.' },
  { type: 'fakta', tekst: 'Svigermors tunge (Sansevieria) er en av få planter som produserer oksygen også om natten – perfekt på soverommet.' },
  { type: 'fakta', tekst: 'Orkidéfamilien er en av verdens største plantefamilier med nesten 25 000 kjente arter.' },
  { type: 'fakta', tekst: 'Gullranke (Epipremnum aureum) er oppført på WHOs liste over planter som renser inneluften for giftige stoffer.' },
  { type: 'fakta', tekst: 'Aloe vera har vært brukt medisinsk i over 6 000 år – de eldste kjente avbildningene er fra Egypt.' },
  { type: 'fakta', tekst: 'Bergfrue ble kåret til Norges nasjonalplante i 1935, og deler tittelen med røsslyng etter en radiokåring i 1976.' },
  { type: 'fakta', tekst: 'Hoya, også kalt voksblomst, kan leve i over 30 år med godt stell og produserer nektar med en søt duft.' },
  { type: 'fakta', tekst: 'Fiken (Ficus) var blant de første plantene mennesket dyrket – funn tyder på kultivering for over 11 000 år siden.' },
  { type: 'fakta', tekst: 'Aglaonema kalles på norsk «sjømannstrøst» fordi den trives godt i lite lys – selv under dekk på skip.' },
  { type: 'fakta', tekst: 'Planters røtter kommuniserer med hverandre gjennom sopptråder i jorda – dette nettverket kalles «skogens internett».' },
  { type: 'fakta', tekst: 'Norge har knapt 2 000 ville frøplante-arter, mens det på verdensbasis finnes over 350 000 kjente plantearter.' },
  { type: 'fakta', tekst: 'Issoleien er den høyest voksende blomsterplanten i Norge – den er funnet på Galdhøpiggen i 2 370 meters høyde.' },
  { type: 'fakta', tekst: 'Kaktuser lagrer vann i stilken, ikke i tornene. Tornene er egentlig omdannede blader som reduserer vanntap.' },
  { type: 'fakta', tekst: 'Gregor Mendel oppdaget arvelæren gjennom studier av bønner – ikke gjennom dyreforsøk, slik mange tror.' },
  { type: 'fakta', tekst: 'Fredskallen (Spathiphyllum) er kjent for å «henge med hodet» når den tørster – og reiser seg raskt igjen etter vanning.' },
  { type: 'fakta', tekst: 'Kongsbregna har holdt seg nesten uforandret i over 180 millioner år – den er en av jordens eldste planter.' },
  { type: 'fakta', tekst: 'Gran innvandret til Norge fra øst og er fortsatt i spredning mot vest – den har ennå ikke nådd sin klimatiske vestgrense.' },
  { type: 'fakta', tekst: 'Pothos er nesten umulig å drepe – den kan overleve i lite lys, glemt vanning og til og med i vann uten jord.' },
  { type: 'fakta', tekst: 'Lavendel er opprinnelig fra Middelhavsområdet, men trives overraskende godt i norske hager på solrike og godt drenerte steder.' },
  { type: 'fakta', tekst: 'Planter kan høre – forskning viser at enkelte planter reagerer på lyden av beitende insekter og styrker forsvaret sitt.' },
  { type: 'fakta', tekst: 'Hvitveis (Anemone nemorosa) er en av vårens første blomster i norsk natur og sprer seg sakte – bare noen centimeter i året.' },
  { type: 'fakta', tekst: 'Botanikkens grunnlegger regnes som den greske filosofen Theofrastos, som beskrev over 500 plantearter rundt 300 f.Kr.' },
  { type: 'fakta', tekst: 'Laven Altissima finnes ikke noe annet sted i verden enn på toppen av Galdhøpiggen.' },
  { type: 'fakta', tekst: 'Sukkulenter lagrer vann i bladene sine og er tilpasset tørre strøk – derfor bør de vernes mot for mye regn og overvanning.' },
  { type: 'fakta', tekst: 'Orkidéen kan blomstre opp igjen etter at blomstene har visnet – klipp stilken over et knutepunkt og vent tålmodig.' },
]

export default function HjemPage() {
  const [planter, setPlanter] = useState<Plante[]>([])
  const [hilsen, setHilsen] = useState('')
  const [profilBilde, setProfilBilde] = useState('')
  const [profilInitial, setProfilInitial] = useState('')
  const [dagensKort, setDagensKort] = useState<TipsKort | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setDagensKort(tips[Math.floor(Math.random() * tips.length)])
  }, [])

  useEffect(() => {
    async function hentData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const navn = hentNavn(user.email || '')
      setHilsen(hentHilsen(navn))
      setProfilInitial(navn ? navn[0].toUpperCase() : (user.email || 'G')[0].toUpperCase())

      const { data: profil } = await supabase
        .from('profiles')
        .select('bilde_url, navn')
        .eq('id', user.id)
        .single()
      if (profil?.bilde_url) setProfilBilde(profil.bilde_url)
      if (profil?.navn) setProfilInitial(profil.navn[0].toUpperCase())

      const { data } = await supabase
        .from('planter')
        .select('*')
        .eq('bruker_id', user.id)
        .order('neste_vanning', { ascending: true })
        .limit(5)
      if (data) setPlanter(data)
    }
    hentData()
  }, [])

  const dagTilVanning = (dato: string) => {
    if (!dato) return null
    const diff = Math.ceil((new Date(dato).getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'Forfalt!'
    if (diff === 0) return 'I dag'
    if (diff === 1) return 'I morgen'
    return 'Om ' + diff + ' dager'
  }

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>
            {hilsen}
          </p>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '42px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Plantene dine
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
        <button
          onClick={() => window.location.href = '/varsler'}
          style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', backgroundColor: '#f0ece3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Bell size={18} color="#4a4a42" />
        </button>
        <button
          onClick={() => window.location.href = '/profil'}
          style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', backgroundColor: '#d4e8d0', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          {profilBilde ? (
            <img src={profilBilde} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#154212' }}>
              {profilInitial}
            </span>
          )}
        </button>
        </div>
      </div>

      <PushVarsler />
      <DagligMelding />

      {dagensKort && (
        <div style={{ borderRadius: '20px', padding: '20px', marginBottom: '32px', background: 'linear-gradient(135deg, #154212 0%, #2d5a27 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {dagensKort.type === 'fakta' ? (
              <Sparkles size={13} color="rgba(255,255,255,0.6)" />
            ) : (
              <Sun size={13} color="rgba(255,255,255,0.6)" />
            )}
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
              {dagensKort.type === 'fakta' ? 'Visste du at' : 'Dagens tips'}
            </p>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.92)' }}>
            {dagensKort.tekst}
          </p>
        </div>
      )}

      <div>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1c1c18', marginBottom: '16px', letterSpacing: '-0.01em' }}>
          Trenger vann snart
        </h2>

        {planter.length === 0 ? (
          <div style={{ borderRadius: '20px', padding: '40px 24px', textAlign: 'center', backgroundColor: '#f0ece3' }}>
            <Leaf size={32} color="#c4c0b7" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>
              Du har ingen planter ennå.{' '}
              <a href="/planter/ny" style={{ color: '#154212', fontWeight: 600 }}>Legg til din første!</a>
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {planter.map((plante) => (
              <a key={plante.id} href={'/planter/' + plante.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {plante.bilde_url ? (
                      <img src={plante.bilde_url} alt={plante.navn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Leaf size={20} color="#154212" />
                    )}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 600, color: '#1c1c18' }}>
                      {plante.navn}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42' }}>
                      {plante.art || 'Ukjent art'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplets size={14} color="#4a7c59" />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#4a7c59' }}>
                    {dagTilVanning(plante.neste_vanning) ?? '–'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        <div style={{ marginTop: '32px' }}>
          <Sesongkort />
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1c1c18', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            Din hage
          </h2>
          <HjemStatistikk />
        </div>

        <Plantegalleri />
        <Minneskrin />
        <InspoGalleri />
        <DeltAktivitet />
        <VærStripe />
      </div>
    </div>
  )
}
