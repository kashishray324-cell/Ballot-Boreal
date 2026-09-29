import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Check, ChevronRight, CircleHelp, Cloud, Fingerprint, KeyRound, Landmark, LockKeyhole, ShieldCheck, UsersRound, Wallet, X } from 'lucide-react'
import { importLocalWitness, loadLocalWitness, replaceLocalWitness } from './lib/vault'
import { connectWallet, describeWalletError, discoverWallets, submitProof, type MidnightProvider, type Network } from './lib/wallet'
import { getMetrics, getPolicyPlan, recordReceipt, type PolicyPlan } from './lib/api'
import { assessPublicText } from './lib/privacy'

const steps = ['Understand the ballot', 'Prepare local eligibility', 'Keep data private', 'Review disclosure', 'Connect 1AM', 'Generate proof', 'View receipt']
const ballotId = 'northward-housing-2026'
const publicRequirement = 'Membership included in the cooperative authority eligibility-root snapshot for this ballot. One valid proof is allowed per member.'
const policyPreflight = assessPublicText(publicRequirement)

export default function App() {
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(3)
  const [network, setNetwork] = useState<Network>('preview')
  const [witness, setWitness] = useState(() => loadLocalWitness())
  const [wallet, setWallet] = useState<{ provider: MidnightProvider; name: string; address?: string } | null>(null)
  const [state, setState] = useState<'ready' | 'connecting' | 'proving' | 'submitted' | 'error'>('ready')
  const [message, setMessage] = useState('Review the two public outputs before you continue.')
  const [walletCount, setWalletCount] = useState(() => discoverWallets().length)
  const [metrics, setMetrics] = useState<number | null>(null)
  const [policyPlan, setPolicyPlan] = useState<PolicyPlan | null>(null)
  const [policyState, setPolicyState] = useState<'idle' | 'loading' | 'error'>('idle')

  useEffect(() => {
    let lastRefreshAt = 0
    const refreshPublicState = async () => {
      if (Date.now() - lastRefreshAt < 30_000) return
      lastRefreshAt = Date.now()
      setWalletCount(discoverWallets().length)
      try { setMetrics((await getMetrics()).finalized_proofs) } catch { setMetrics(null) }
    }
    void refreshPublicState()
    window.addEventListener('focus', refreshPublicState)
    return () => window.removeEventListener('focus', refreshPublicState)
  }, [])

  const prepare = () => { setWitness(replaceLocalWitness('Local eligibility record')); setStep(2); setMessage('A private eligibility record is now held only on this device.') }
  const importWitness = async (file?: File) => {
    if (!file) return
    try {
      setWitness(importLocalWitness(await file.text()))
      setStep(2)
      setState('ready')
      setMessage('Authority-issued membership proof imported locally. Its private values were not uploaded.')
    } catch (error) { setState('error'); setMessage(error instanceof Error ? error.message : 'The membership proof could not be imported.') }
  }
  const selectNetwork = (next: Network) => { setNetwork(next); setWallet(null); setState('ready'); setMessage(`Network changed to ${next}. Your wallet session was reset.`) }
  const connect = async () => { try { setState('connecting'); const result = await connectWallet(network); setWallet({ provider: result.provider, name: result.name || 'Midnight wallet', address: result.address }); setStep(4); setState('ready'); setMessage('Wallet connected for this browser session only.') } catch (error) { setState('error'); setMessage(describeWalletError(error)) } }
  const prove = async () => {
    if (!witness) { setState('error'); setStep(1); setMessage('Prepare a local membership proof before connecting the wallet.'); return }
    if (!wallet) return connect()
    try {
      setState('proving')
      setStep(5)
      setMessage('1AM is proving and balancing the real Compact transaction. Keep the wallet open; private membership data stays on this device.')
      const result = await submitProof(wallet.provider, witness, ballotId, network)
      setState('submitted')
      setStep(6)
      try {
        await recordReceipt({ tx_id: String(result.txId), ballot_id: ballotId, network, nullifier: result.nullifier, outcome: 'accepted' })
        setMetrics((current) => (current ?? 0) + 1)
        setMessage(`Finalized in block ${result.blockHeight}. Public receipt ${String(result.txId).slice(0, 14)}… recorded.${result.deployed ? ' A ballot contract was deployed for this local proof.' : ''}`)
      } catch {
        setMessage(`Finalized in block ${result.blockHeight}. Transaction ${String(result.txId).slice(0, 14)}… The public API could not mirror the receipt, but the on-chain proof is final.`)
      }
    } catch (error) { setState('error'); setMessage(describeWalletError(error)) }
  }
  const explainPolicy = async () => {
    if (!policyPreflight.safe) { setPolicyState('error'); return }
    try { setPolicyState('loading'); setPolicyPlan(await getPolicyPlan(policyPreflight.sanitized)); setPolicyState('idle') } catch { setPolicyState('error') }
  }
  const transition = reduceMotion ? { duration: 0 } : { duration: .22, ease: 'easeOut' as const }
  return <div className="app-shell">
    <a className="skip-link" href="#vote">Skip to voter workspace</a>
    <header className="topbar"><a className="brand" href="#top"><span aria-hidden="true">◒</span> Ballot Boreal</a><nav aria-label="Primary"><a href="#how-it-works">How it works</a><a href="#privacy">Privacy model</a><a href="#vote">Vote privately</a><a href="#faq">FAQ</a></nav><div className="topbar-actions"><div className="network-status"><span className="status-dot" /> {network} <span className="divider" /> {wallet ? 'Wallet connected' : 'Wallet ready'}</div><button className={wallet ? 'header-wallet connected' : 'header-wallet'} disabled={state === 'connecting'} onClick={() => wallet ? document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' }) : void connect()}><Wallet size={15} />{state === 'connecting' ? 'Connecting…' : wallet ? '1AM connected' : 'Connect 1AM'}</button></div></header>
    <main id="top">
      <section className="hero section-wrap"><div className="hero-copy"><p className="eyebrow">Civic voting, without a voter record</p><h1>One member. One private proof. A better public ballot.</h1><p>Ballot Boreal lets community members prove they are eligible—without exposing a membership record, their identity, or their selection to the ballot.</p><div className="hero-actions"><a className="hero-primary" href="#vote">Review your privacy boundary <ChevronRight size={17} /></a><a className="hero-link" href="#how-it-works">See how it works <ArrowUpRight size={16} /></a></div></div><div className="hero-board" aria-label="Ballot privacy at a glance"><div className="hero-board-top"><span>Northward annual ballot</span><span>Closes 30 Sep</span></div><div className="hero-board-main"><Landmark size={34} /><div><strong>Eligible, not identified.</strong><p>A civic proof confirms the rule, then forgets the record.</p></div></div><div className="hero-board-stats"><div><strong>01</strong><span>valid proof<br />per member</span></div><div><strong>02</strong><span>deliberate<br />disclosures</span></div></div></div></section>
      <section id="how-it-works" className="story-section section-wrap"><div className="section-intro"><p className="eyebrow">A clearer path to participation</p><h2>Designed around the questions voters actually ask.</h2></div><div className="story-grid"><article><span>01</span><UsersRound size={22} /><h3>Am I allowed to vote?</h3><p>Compact checks your private member secret and Merkle path against the authority’s public eligibility root.</p></article><article><span>02</span><LockKeyhole size={22} /><h3>What stays private?</h3><p>Your member secret, Merkle leaf and path, identity, and wallet-held proving material never enter the public receipt.</p></article><article><span>03</span><Fingerprint size={22} /><h3>How is duplicate voting stopped?</h3><p>An unlinkable nullifier is unique to this ballot. It stops a replay without identifying a member.</p></article></div></section>
      <section className="trust-strip"><div className="section-wrap"><p>Built for cooperatives, student unions, and member associations that need a ballot—not a database of voters.</p><div><span>Public rule</span><span>Private proof</span><span>Verifiable count</span></div></div></section>
      <section className="privacy-promise section-wrap"><div><p className="eyebrow">A small public footprint</p><h2>Privacy is not a setting you have to find.</h2><p>The interface puts the boundary before the wallet connection, so each voter can decide with full context.</p></div><dl><div><dt>Never public</dt><dd>Member secret, Merkle path, identity, wallet secrets</dd></div><div><dt>Purposefully public</dt><dd>Eligibility outcome, nullifier, ballot state, aggregate</dd></div></dl></section>
      <div id="vote" className="voter-anchor"><p className="eyebrow">Voter workspace</p><h2>Make an informed private vote.</h2></div>
    <div id="workspace" className="workspace">
      <aside className="step-rail" aria-label="Voting steps"><p className="eyebrow">Your voting journey</p>{steps.map((label, index) => <button key={label} className={index === step ? 'step current' : index < step ? 'step done' : 'step'} onClick={() => setStep(index)}><span>{index < step ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span>{label}</button>)}</aside>
      <section className="content"><div className="mobile-step">Step {step + 1} of {steps.length}</div><motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={transition}><p className="eyebrow">Step 4 — public disclosure</p><h1>See exactly what leaves your device.</h1><p className="lede">The ballot checks that you are eligible and have not voted before. It does not receive your identity, eligibility record, or vote selection.</p></motion.div>
        <section className="requirement card"><div><p className="eyebrow">Public requirement</p><h2>Northward Housing Cooperative · Annual board ballot</h2><p>Prove your private member commitment is included in the authority’s eligibility-root snapshot. One valid proof is allowed per member.</p></div><span className="deadline">Closes 30 Sep · 18:00 UTC</span></section>
        <section id="privacy" className="boundary" aria-label="Privacy boundary"><div className="private-side"><div className="boundary-title"><LockKeyhole size={20} /><div><p className="eyebrow">Stays on your device</p><h2>Private witness</h2></div></div><ul><li>Your 32-byte member secret</li><li>Your eight-level Merkle path</li><li>Your stable membership leaf</li><li>Wallet-held proving material</li></ul><div className="witness-actions"><button className="text-button" onClick={prepare}>{witness ? `Replace with demo proof · v${witness.version}` : 'Create demo proof'} <ChevronRight size={16} /></button><label className="text-button file-button">Import authority proof<input className="file-input" type="file" accept="application/json,.json" onChange={(event) => void importWitness(event.currentTarget.files?.[0])} /></label></div></div><div className="public-side"><div className="boundary-title"><Cloud size={20} /><div><p className="eyebrow">Published to Midnight</p><h2>Minimal public receipt</h2></div></div><ul><li><strong>Eligibility: valid</strong> — no underlying member leaf</li><li><strong>One-time nullifier</strong> — prevents a second proof</li><li>Ballot ID and finalized transaction ID</li><li>Public aggregate count</li></ul><p className="small">The nullifier is an unlinkable one-time value. It proves uniqueness without naming a voter.</p></div></section>
        <section className="review card"><div className="review-head"><div><p className="eyebrow">Disclosure review</p><h2>Two deliberate disclosures</h2></div><ShieldCheck size={28} /></div><div className="disclosure"><span>01</span><div><strong>Eligibility is valid</strong><p>The contract learns the requirement was met, not which member leaf satisfied it.</p></div><Check size={18} /></div><div className="disclosure"><span>02</span><div><strong>One-time nullifier</strong><p>The contract rejects duplicates without knowing who participated.</p></div><Check size={18} /></div><div className="notice"><CircleHelp size={18} /><p>This MVP submits the real eligibility and uniqueness proof. A governed sealed-choice and tally circuit remains a separate production phase.</p></div></section>
        <section className="proof card"><div><p className="eyebrow">Proof status</p><h2>{state === 'submitted' ? 'Proof finalized on Midnight' : state === 'proving' ? 'Generating your proof locally' : witness ? 'Ready when you are' : 'Local membership proof required'}</h2></div><div className="proof-track"><span className={state === 'proving' || state === 'submitted' ? 'active' : ''}>Local check</span><span className={state === 'submitted' ? 'active' : ''}>Wallet submission</span><span className={state === 'submitted' ? 'active' : ''}>Network finalization</span></div><button className="primary" disabled={state === 'connecting' || state === 'proving'} onClick={prove}>{state === 'proving' ? 'Generating proof…' : !witness ? 'Prepare membership proof first' : wallet ? 'Generate and submit proof' : 'Connect 1AM to continue'} <ChevronRight size={17} /></button></section>
        <div role="status" className={`message ${state}`}>{state === 'error' ? <X size={18} /> : <Fingerprint size={18} />}{message}</div>
      </section>
      <aside className="utility-rail"><section className="wallet-card"><div className="utility-heading"><Wallet size={19} /><h2>Wallet session</h2></div><div className="network-tabs" role="tablist"><button aria-selected={network === 'preview'} onClick={() => selectNetwork('preview')}>Preview</button><button aria-selected={network === 'preprod'} onClick={() => selectNetwork('preprod')}>Preprod</button></div><p className="small">{wallet ? `${wallet.name}${wallet.address ? ` · ${wallet.address.slice(0, 8)}…` : ''}` : walletCount ? `${walletCount} provider found · 1AM preferred` : 'Looking for a UUID-keyed Midnight provider'}</p>{wallet ? <button className="secondary" onClick={() => { wallet.provider.disconnect?.(); setWallet(null); setMessage('Wallet disconnected from this session.'); }}>Disconnect session</button> : <button className="secondary" onClick={connect} disabled={state === 'connecting'}>{state === 'connecting' ? 'Connecting…' : 'Connect 1AM'}</button>}</section>
        <section className="gemini-card"><div className="utility-heading"><KeyRound size={19} /><h2>Policy guide</h2></div><p>Get a constrained, plain-language explanation of this public requirement.</p><div className={policyPreflight.safe ? 'privacy-preflight safe' : 'privacy-preflight blocked'}><div className="preflight-head"><ShieldCheck size={17} /><strong>Local privacy preflight</strong><span>{policyPreflight.checks.filter((check) => check.passed).length}/{policyPreflight.checks.length}</span></div><ul>{policyPreflight.checks.map((check) => <li key={check.id} className={check.passed ? 'passed' : 'failed'}>{check.passed ? <Check size={13} /> : <X size={13} />}{check.label}</li>)}</ul><small>{policyPreflight.safe ? 'Safe to explain · nothing was uploaded for this check.' : 'Blocked locally · remove private-looking text first.'}</small></div><div className="ai-boundary"><span>Assistant sees</span><strong>Public policy text only</strong><small>Never your witness, secret, wallet address, or vote.</small></div>{policyPlan && <div className="policy-answer"><strong>{policyPlan.summary}</strong><p>{policyPlan.caution}</p><small>{policyPlan.source === 'gemini' ? 'Structured Gemini response' : 'Deterministic local explanation'}</small></div>}<button className="text-button" onClick={explainPolicy} disabled={policyState === 'loading' || !policyPreflight.safe}>{policyState === 'loading' ? 'Preparing explanation…' : 'Explain the two disclosures'} <ChevronRight size={16} /></button>{policyState === 'error' && <p className="inline-error">{policyPreflight.safe ? 'The policy guide is unavailable. Your proof flow is unaffected.' : 'Private-looking content was blocked before it could leave this device.'}</p>}</section>
        <section id="results" className="metrics"><p className="eyebrow">Public ballot metrics</p><div><strong>{metrics ?? '—'}</strong><span>finalized proofs</span></div><div><strong>—</strong><span>turnout opens with the ballot</span></div><p className="small">Public figures load from the public API. No outcome is presented as final before an on-chain receipt is finalized.</p></section>
      </aside>
    </div>
      <section id="faq" className="faq-section section-wrap"><div><p className="eyebrow">Questions, answered plainly</p><h2>Privacy should be explainable before it is technical.</h2></div><div className="faq-list"><details open><summary>Does this proof submit my selection?</summary><p>Not yet. This MVP submits a real eligibility and one-person/one-proof transaction. Sealed choices and governed tally opening are explicitly left for the production election contract.</p></details><details><summary>Why is there a nullifier?</summary><p>It lets the public contract detect a second attempt for this ballot without learning which member created it.</p></details><details><summary>What can Gemini see?</summary><p>Only public policy text that has been redacted for obvious sensitive patterns. It never receives witnesses, secrets, wallet addresses, or choices.</p></details></div></section>
    </main>
    <footer id="help"><span>Ballot Boreal is a privacy-first civic voting prototype.</span><div><a href="#privacy">Privacy model</a><a href="https://docs.midnight.network/" target="_blank" rel="noreferrer">Midnight documentation ↗</a></div></footer>
  </div>
}
