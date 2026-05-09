import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ComposedChart, Line, ReferenceLine
} from "recharts";

// ═══════════════════════════════════════════════════════════════
//  THEME SYSTEM
// ═══════════════════════════════════════════════════════════════
const THEMES = {
  dark: {
    id:"dark",name:"ATLAS Dark",
    bg:"#0B0E13",sf:"#10141C",card:"#151A24",b:"#1E2530",bH:"#2A3345",bL:"#171D2A",
    mint:"#7DFFC3",mintD:"rgba(125,255,195,0.06)",grn:"#4ADE80",grnD:"rgba(74,222,128,0.06)",
    red:"#FF6B81",redD:"rgba(255,107,129,0.06)",lav:"#B4A0FF",
    txt:"#E8E8F0",ts:"#8892A4",tm:"#4A5568",warn:"#FBBF24",
    sb:"#0A0D12",sbA:"#141B26",
  },
  nft: {
    id:"nft",name:"NFT Vibe",
    bg:"#0A0A0A",sf:"#111111",card:"#1A1A1A",b:"#2A2A2A",bH:"#3A3A3A",bL:"#151515",
    mint:"#D0FF00",mintD:"rgba(208,255,0,0.08)",grn:"#D0FF00",grnD:"rgba(208,255,0,0.06)",
    red:"#FF4444",redD:"rgba(255,68,68,0.06)",lav:"#8116E0",
    txt:"#F0F0F0",ts:"#888888",tm:"#555555",warn:"#FFB800",
    sb:"#080808",sbA:"#1A1A1A",
  },
  steel: {
    id:"steel",name:"Chrome Steel",
    bg:"#071526",sf:"#0C1C33",card:"#112240",b:"#1E3456",bH:"#2A4570",bL:"#0E1D38",
    mint:"#F28D52",mintD:"rgba(242,141,82,0.08)",grn:"#4ADE80",grnD:"rgba(74,222,128,0.06)",
    red:"#FF6B81",redD:"rgba(255,107,129,0.06)",lav:"#BDD9F2",
    txt:"#E8EDF5",ts:"#8899B4",tm:"#506480",warn:"#FBBF24",
    sb:"#051220",sbA:"#0E1F3A",
  },
};

function getTheme(){try{return THEMES[window._atlasTheme]||THEMES.dark}catch(e){return THEMES.dark}}
function setThemeId(id){try{window._atlasTheme=id}catch(e){}}
try{window._atlasTheme=window._atlasTheme||"dark"}catch(e){}

const M="'JetBrains Mono',monospace";
const S="'Plus Jakarta Sans','DM Sans',system-ui,sans-serif";
const fmt=v=>v>=1000?"$"+v.toLocaleString("en-US",{maximumFractionDigits:0}):"$"+v.toFixed(2);
const pf=v=>(v>=0?"+":"")+v.toFixed(2)+"%";
const dcc=(v,inv,C)=>inv?(v>0?C.red:C.grn):(v>=0?C.grn:C.red);
const api=async p=>{try{const r=await fetch(p);return r.ok?await r.json():null}catch(e){return null}};

// ═══════════════════════════════════════════════════════════════
//  EXISTING COMPONENTS (unchanged)
// ═══════════════════════════════════════════════════════════════
function Gauge({value,max=100,size=76,label,color,thick=5,C}){
  const r=(size-thick)/2,ci=Math.PI*r,p=Math.min(value/max,1),o=ci-p*ci;
  return(<div style={{textAlign:"center"}}>
    <svg width={size} height={size/2+12} viewBox={`0 0 ${size} ${size/2+12}`}>
      <path d={`M ${thick/2} ${size/2} A ${r} ${r} 0 0 1 ${size-thick/2} ${size/2}`} fill="none" stroke={C.bL} strokeWidth={thick} strokeLinecap="round"/>
      <path d={`M ${thick/2} ${size/2} A ${r} ${r} 0 0 1 ${size-thick/2} ${size/2}`} fill="none" stroke={color} strokeWidth={thick} strokeLinecap="round" strokeDasharray={ci} strokeDashoffset={o} style={{transition:"stroke-dashoffset .8s"}}/>
      <text x={size/2} y={size/2-2} textAnchor="middle" fill={C.txt} fontFamily={M} fontSize={15} fontWeight="700">{value}%</text>
    </svg>
    {label&&<div style={{fontFamily:M,fontSize:10,color:C.ts,letterSpacing:1,textTransform:"uppercase",marginTop:-2}}>{label}</div>}
  </div>);
}

function Pill({sig,sm,C}){
  const m={"STRONG BUY":{bg:C.mint,c:"#000"},"BUY":{bg:C.mintD,c:C.mint,bd:`1px solid ${C.mint}33`},"FORMING":{bg:"rgba(255,255,255,0.04)",c:C.ts,bd:`1px solid ${C.b}`},"SKIP":{bg:C.redD,c:C.red,bd:`1px solid ${C.red}33`}};
  const s=m[sig]||m.FORMING;
  return<span style={{display:"inline-block",padding:sm?"2px 8px":"4px 12px",borderRadius:4,fontFamily:M,fontSize:sm?9:10,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",background:s.bg,color:s.c,border:s.bd||"none"}}>{sig}</span>;
}

function Spark({data,color,w=100,h=28}){
  const d=Array.isArray(data)?data.map((v,i)=>({i,p:typeof v==="number"?v:0})):[];
  if(d.length<2)return null;
  const id="s"+(color||"").replace("#","");
  return(<ResponsiveContainer width={w} height={h}><AreaChart data={d}><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={.3}/><stop offset="100%" stopColor={color} stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="p" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false}/></AreaChart></ResponsiveContainer>);
}

function Tip({active,payload,label}){
  if(!active||!payload?.length)return null;
  const T=getTheme();
  return<div style={{background:T.card,border:`1px solid ${T.b}`,borderRadius:6,padding:"6px 10px",fontFamily:M,fontSize:10}}><div style={{color:T.ts}}>{label}</div><div style={{color:T.mint,fontWeight:700}}>${payload[0].value?.toFixed(2)}</div></div>;
}

function statusText(gate,C){
  if(!gate)return{icon:"◌",text:"Loading...",color:C.tm,bg:C.card};
  const s=gate.status;
  if(s==="GO")return{icon:"●",text:"ALL CLEAR — Full signals active, trade normally",color:C.grn,bg:C.grnD};
  if(s==="CAUTION")return{icon:"●",text:"HALF SIZE — Mixed signals, reduce all positions",color:C.warn,bg:C.warn+"12"};
  if(s==="WARN")return{icon:"●",text:"WATCH ONLY — Do not enter new trades today",color:"#F59E0B",bg:"rgba(245,158,11,0.06)"};
  return{icon:"●",text:"STAND DOWN — Market conditions too risky",color:C.red,bg:C.redD};
}

function tierChecklist(tiers,C){
  if(!tiers)return[];
  const items=[];
  if(tiers.survival===100)items.push({icon:"✓",text:"Safe to trade — not overbought, no earnings",color:C.grn});
  else items.push({icon:"✗",text:"Blocked — too close to highs or earnings soon",color:C.red});
  if(tiers.regime>=67)items.push({icon:"✓",text:"Market supports this trade",color:C.grn});
  else if(tiers.regime>=33)items.push({icon:"◐",text:"Market is mixed — partial support",color:C.warn});
  else items.push({icon:"✗",text:"Market is working against you",color:C.red});
  if(tiers.timing>=67)items.push({icon:"✓",text:"Good entry point right now",color:C.grn});
  else if(tiers.timing>=33)items.push({icon:"◐",text:"Entry timing is OK, not ideal",color:C.warn});
  else items.push({icon:"○",text:"Wait for a better entry",color:C.ts});
  if(tiers.edge>=50)items.push({icon:"✓",text:"Extra edge — outperforming or post-earnings drift",color:C.grn});
  else items.push({icon:"○",text:"No extra edge detected",color:C.tm});
  return items;
}

function newsTag(sentiment,C){
  if(sentiment==="bull")return{label:"BULLISH",color:C.grn,bg:C.grnD};
  if(sentiment==="bear")return{label:"BEARISH",color:C.red,bg:C.redD};
  if(sentiment==="warn")return{label:"MONITOR",color:C.warn,bg:C.warn+"12"};
  return{label:"NEUTRAL",color:C.ts,bg:C.card};
}

function TVChart({symbol,theme="dark"}){
  const containerId="tv_chart_"+symbol.replace(/[^a-zA-Z0-9]/g,"");
  React.useEffect(()=>{
    const el=document.getElementById(containerId);
    if(!el)return;
    el.innerHTML="";
    const script=document.createElement("script");
    script.src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type="text/javascript";
    script.async=true;
    script.innerHTML=JSON.stringify({
      autosize:true,symbol,interval:"D",timezone:"America/New_York",
      theme,style:"1",locale:"en",allow_symbol_change:true,calendar:false,
      support_host:"https://www.tradingview.com",hide_top_toolbar:false,
      hide_legend:false,save_image:false,studies:["STD;SMA"],
      backgroundColor:"rgba(11,14,19,1)",gridColor:"rgba(30,37,48,0.3)",
    });
    el.appendChild(script);
  },[symbol,theme]);
  return<div id={containerId} style={{width:"100%",height:"100%"}}/>;
}

// ═══════════════════════════════════════════════════════════════
//  NEW ① — FUTURE CHART COMPONENT
//  Backend: GET /api/future-chart/{ticker}?period=3M
//  Returns: { history:[{date,price}], projection:[{date,price,upper,lower}],
//             projection_return: 12.4, projection_days: 30 }
// ═══════════════════════════════════════════════════════════════
function FutureChart({ticker, C}){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("3M");

  useEffect(()=>{
    if(!ticker) return;
    setLoading(true); setData(null);
    fetch(`/api/future-chart/${ticker}?period=${period}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(()=>setLoading(false));
  },[ticker, period]);

  // Merge history + projection into one series for ComposedChart
  const allPoints = data ? [
    ...data.history.map(p=>({date:p.date, hist:p.price})),
    // Bridge point — connect history to projection
    {date:data.history[data.history.length-1]?.date,
     hist:data.history[data.history.length-1]?.price,
     proj:data.history[data.history.length-1]?.price},
    ...data.projection.map(p=>({date:p.date, proj:p.price, upper:p.upper, lower:p.lower}))
  ] : [];

  const splitDate = data?.history?.[data.history.length-1]?.date;
  const projReturn = data?.projection_return;
  const projDays = data?.projection_days;

  return(
    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px",marginBottom:10}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div>
          <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:1}}>FUTURE CHART</div>
          <div style={{fontFamily:S,fontSize:10,color:C.ts}}>
            Historical price + statistical projection (linear regression · Polygon data)
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          {["1M","3M","6M"].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{
              padding:"3px 10px",borderRadius:4,cursor:"pointer",fontFamily:M,fontSize:9,
              border:`1px solid ${period===p?C.mint+"44":C.b}`,
              background:period===p?C.mint+"18":"transparent",
              color:period===p?C.mint:C.tm,
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading&&(
        <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontFamily:M,fontSize:11,color:C.ts,animation:"pulse 2s infinite"}}>Loading chart data...</span>
        </div>
      )}

      {/* No endpoint yet */}
      {!loading&&!data&&(
        <div style={{height:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
          <div style={{fontFamily:M,fontSize:10,color:C.tm}}>Add backend endpoint to enable this feature</div>
          <code style={{fontFamily:M,fontSize:9,color:C.mint,background:C.sf,padding:"4px 12px",borderRadius:4}}>GET /api/future-chart/{"{ticker}"}?period=3M</code>
          <div style={{fontFamily:M,fontSize:9,color:C.tm}}>See future_chart.py for implementation</div>
        </div>
      )}

      {/* Chart */}
      {!loading&&data&&(
        <>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={allPoints} margin={{top:4,right:8,bottom:0,left:0}}>
              <defs>
                <linearGradient id="fcHistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.mint} stopOpacity={0.15}/>
                  <stop offset="100%" stopColor={C.mint} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="fcBandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.lav} stopOpacity={0.08}/>
                  <stop offset="100%" stopColor={C.lav} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fill:C.tm,fontSize:8,fontFamily:M}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{fill:C.tm,fontSize:8,fontFamily:M}} axisLine={false} tickLine={false} width={44} domain={["auto","auto"]}/>
              <Tooltip content={({active,payload,label})=>{
                if(!active||!payload?.length)return null;
                const v=payload.find(p=>p.value!=null&&p.name!=="upper"&&p.name!=="lower");
                if(!v)return null;
                return<div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:5,padding:"5px 10px",fontFamily:M,fontSize:10}}>
                  <div style={{color:C.tm,marginBottom:2}}>{label}</div>
                  <div style={{color:v.name==="proj"?C.lav:C.mint,fontWeight:700}}>${v.value?.toFixed(2)}</div>
                  <div style={{color:C.tm,fontSize:8}}>{v.name==="proj"?"Projected":"Historical"}</div>
                </div>;
              }}/>
              {/* Confidence band (upper/lower area) */}
              <Area dataKey="upper" fill="url(#fcBandGrad)" stroke="none" fillOpacity={1} legendType="none"/>
              <Area dataKey="lower" fill={C.bg} stroke="none" fillOpacity={1} legendType="none"/>
              {/* Historical area */}
              <Area dataKey="hist" fill="url(#fcHistGrad)" stroke={C.mint} strokeWidth={2} dot={false}/>
              {/* Projection dashed line */}
              <Line dataKey="proj" stroke={C.lav} strokeWidth={1.5} strokeDasharray="5 3" dot={false} legendType="none"/>
              {/* Vertical divider at today */}
              {splitDate&&<ReferenceLine x={splitDate} stroke={C.b} strokeDasharray="3 3" label={{value:"TODAY",fill:C.tm,fontSize:8,fontFamily:M,position:"top"}}/>}
            </ComposedChart>
          </ResponsiveContainer>

          {/* Legend + projection return */}
          <div style={{display:"flex",alignItems:"center",gap:16,marginTop:6,paddingTop:6,borderTop:`1px solid ${C.bL}`}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:16,height:2,background:C.mint,borderRadius:1}}/>
              <span style={{fontFamily:M,fontSize:9,color:C.ts}}>Historical</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:16,height:0,borderTop:`2px dashed ${C.lav}`}}/>
              <span style={{fontFamily:M,fontSize:9,color:C.ts}}>Projection</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:16,height:8,background:C.lav+"18",borderRadius:2}}/>
              <span style={{fontFamily:M,fontSize:9,color:C.ts}}>Confidence band</span>
            </div>
            {projReturn!=null&&(
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontFamily:M,fontSize:9,color:C.tm}}>Projected {projDays}d return:</span>
                <span style={{fontFamily:M,fontSize:12,fontWeight:700,color:projReturn>0?C.grn:C.red}}>
                  {projReturn>0?"+":""}{projReturn?.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  NEW ② — AI ANALYSIS PANEL (Claude API)
//  Auto-triggers on ticker load. Calls Anthropic API directly.
//  Outputs: Technical bullets, Fundamental bullets, Verdict, Bear case
// ═══════════════════════════════════════════════════════════════
function AIAnalysisPanel({ticker, analyzeData, C}){
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lastTicker, setLastTicker] = useState(null);

  useEffect(()=>{
    if(ticker && analyzeData && ticker !== lastTicker){
      runAnalysis();
      setLastTicker(ticker);
    }
  },[ticker, analyzeData]);

  const runAnalysis = async () => {
    if(!analyzeData) return;
    setLoading(true); setError(false); setAnalysis(null);
    const d = analyzeData;

    const prompt = `You are ATLAS, an institutional stock analyst. Analyze ${ticker} with surgical precision.

Live data:
- Price: $${d.price?.current} (${d.price?.change_pct>0?"+":""}${d.price?.change_pct?.toFixed(2)}% today)
- 52W range position: ${d.price?.range_pct}% from low ($${d.price?.low_52w} → $${d.price?.high_52w})
- Revenue growth: ${d.financials?.revenue_growth}% YoY | EPS growth: ${d.financials?.eps_growth}%
- Profit margin: ${d.financials?.profit_margin}% | P/E: ${d.financials?.pe} | PEG: ${d.valuation?.peg}
- Analyst consensus: ${d.analysts?.consensus} | Price target: $${d.analysts?.target_median} (${d.analysts?.upside}% upside)
- Earnings beats: ${d.earnings?.beats}/${d.earnings?.total} quarters
- Insider activity (90d): ${d.insiders?.buys_90d} buys / ${d.insiders?.sells_90d} sells → ${d.insiders?.signal}
- Valuation: ${d.valuation?.status} (P/E ${d.valuation?.pe} vs 5Y avg ${d.valuation?.pe_5y_avg})
- ATLAS technical score: ${d.atlas_score?.tech_score}/100 — signal: ${d.atlas_score?.signal}
- ATLAS reason: ${d.atlas_score?.reason}
- Sector: ${d.profile?.sector} | ${d.profile?.industry}

Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "technical": ["concise point 1", "concise point 2", "concise point 3"],
  "fundamental": ["concise point 1", "concise point 2", "concise point 3"],
  "verdict": "BUY",
  "confidence": 72,
  "key_risk": "single sentence bear case",
  "catalyst": "next key event or price trigger"
}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          messages:[{role:"user", content:prompt}]
        })
      });
      const result = await response.json();
      const text = result.content?.find(b=>b.type==="text")?.text||"";
      const clean = text.replace(/```json|```/g,"").trim();
      setAnalysis(JSON.parse(clean));
    } catch(e){
      setError(true);
    }
    setLoading(false);
  };

  const vColor = analysis?.verdict==="BUY"?C.grn:analysis?.verdict==="SELL"?C.red:C.warn;

  return(
    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1}}>ATLAS AI ANALYSIS</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {loading&&<span style={{fontFamily:M,fontSize:9,color:C.mint,animation:"pulse 2s infinite"}}>◈ Analyzing...</span>}
          {!loading&&<button onClick={runAnalysis} style={{padding:"2px 8px",borderRadius:3,border:`1px solid ${C.b}`,background:"transparent",color:C.ts,fontFamily:M,fontSize:9,cursor:"pointer"}}>↻</button>}
        </div>
      </div>

      {loading&&(
        <div style={{padding:"24px 0",textAlign:"center"}}>
          <div style={{fontFamily:M,fontSize:11,color:C.mint,animation:"pulse 2s infinite",marginBottom:4}}>◈ Running ATLAS analysis on {ticker}...</div>
          <div style={{fontFamily:M,fontSize:9,color:C.tm}}>Technical · Fundamental · Conviction</div>
        </div>
      )}

      {error&&!loading&&(
        <div style={{fontFamily:M,fontSize:10,color:C.red,padding:"10px 0"}}>Analysis unavailable — check API connection</div>
      )}

      {!loading&&!error&&analysis&&(
        <>
          {/* Two-column: Technical | Fundamental */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div>
              <div style={{fontFamily:M,fontSize:8,color:C.mint,letterSpacing:.8,marginBottom:5,display:"flex",alignItems:"center",gap:4}}>
                <span>◆</span>TECHNICAL
              </div>
              {(analysis.technical||[]).map((pt,i)=>(
                <div key={i} style={{display:"flex",gap:6,padding:"4px 0",borderBottom:i<2?`1px solid ${C.bL}`:"none"}}>
                  <span style={{color:C.mint,fontSize:8,marginTop:2,flexShrink:0}}>●</span>
                  <span style={{fontFamily:S,fontSize:10,color:C.ts,lineHeight:1.45}}>{pt}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontFamily:M,fontSize:8,color:C.lav,letterSpacing:.8,marginBottom:5,display:"flex",alignItems:"center",gap:4}}>
                <span>◆</span>FUNDAMENTAL
              </div>
              {(analysis.fundamental||[]).map((pt,i)=>(
                <div key={i} style={{display:"flex",gap:6,padding:"4px 0",borderBottom:i<2?`1px solid ${C.bL}`:"none"}}>
                  <span style={{color:C.lav,fontSize:8,marginTop:2,flexShrink:0}}>●</span>
                  <span style={{fontFamily:S,fontSize:10,color:C.ts,lineHeight:1.45}}>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verdict bar */}
          <div style={{borderTop:`1px solid ${C.bL}`,paddingTop:8,display:"flex",flexWrap:"wrap",alignItems:"center",gap:8}}>
            <div style={{background:vColor+"18",border:`1px solid ${vColor}33`,borderRadius:4,padding:"3px 12px",fontFamily:M,fontSize:11,fontWeight:700,color:vColor}}>
              {analysis.verdict}
            </div>
            <div style={{fontFamily:M,fontSize:10,color:C.ts}}>
              Confidence <b style={{color:C.txt}}>{analysis.confidence}%</b>
            </div>
            {/* Confidence bar */}
            <div style={{flex:1,height:4,background:C.bL,borderRadius:2,minWidth:60}}>
              <div style={{height:4,width:`${analysis.confidence||0}%`,background:vColor,borderRadius:2,transition:"width .6s"}}/>
            </div>
          </div>

          {/* Bear case + catalyst */}
          <div style={{marginTop:6,display:"flex",flexDirection:"column",gap:4}}>
            {analysis.key_risk&&(
              <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                <span style={{color:C.red,fontSize:9,marginTop:1,flexShrink:0}}>⚠</span>
                <span style={{fontFamily:S,fontSize:10,color:C.ts}}>{analysis.key_risk}</span>
              </div>
            )}
            {analysis.catalyst&&(
              <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                <span style={{color:C.mint,fontSize:9,marginTop:1,flexShrink:0}}>◈</span>
                <span style={{fontFamily:S,fontSize:10,color:C.ts}}>Catalyst: <b style={{color:C.txt}}>{analysis.catalyst}</b></span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  NEW ③ — SUPPORT & RESISTANCE PANEL
//  Uses /api/levels/{ticker} if available (Polygon SMA + pivots)
//  Falls back to 52W range + analyst targets if no endpoint yet
// ═══════════════════════════════════════════════════════════════
function calculateBasicLevels(data){
  if(!data?.price?.current) return [];
  const price = data.price.current;
  const h52 = data.price.high_52w;
  const l52 = data.price.low_52w;
  const levels = [];

  if(h52) levels.push({name:"52W High",price:h52,type:"resistance",strength:"strong"});
  if(l52) levels.push({name:"52W Low",price:l52,type:"support",strength:"strong"});
  if(data.analysts?.target_high) levels.push({name:"Analyst High",price:data.analysts.target_high,type:"resistance",strength:"moderate"});
  if(data.analysts?.target_median) levels.push({name:"Analyst Target",price:data.analysts.target_median,type:data.analysts.target_median>price?"resistance":"support",strength:"moderate"});
  if(data.analysts?.target_low) levels.push({name:"Analyst Low",price:data.analysts.target_low,type:"support",strength:"moderate"});

  if(h52&&l52){
    const mid = parseFloat(((h52+l52)/2).toFixed(2));
    const q1  = parseFloat((l52+(h52-l52)*0.25).toFixed(2));
    const q3  = parseFloat((l52+(h52-l52)*0.75).toFixed(2));
    levels.push({name:"Range Mid",price:mid,type:mid>price?"resistance":"support",strength:"weak"});
    if(Math.abs(q3-price)/price > 0.02) levels.push({name:"Upper Range",price:q3,type:q3>price?"resistance":"support",strength:"weak"});
    if(Math.abs(q1-price)/price > 0.02) levels.push({name:"Lower Range",price:q1,type:q1>price?"resistance":"support",strength:"weak"});
  }
  return levels.filter(l=>l.price&&Math.abs(l.price-price)/price>0.005);
}

function SupportResistancePanel({data, levelsData, C}){
  if(!data?.price?.current) return null;

  const price = data.price.current;
  // Use backend levels if available, otherwise calculate from 52W data
  const levels = levelsData?.levels || calculateBasicLevels(data);
  const source = levelsData?.levels ? "Polygon SMA + Pivot" : "52W Range + Analyst";

  const supports = [...levels].filter(l=>l.price<price).sort((a,b)=>b.price-a.price);
  const resistances = [...levels].filter(l=>l.price>price).sort((a,b)=>a.price-b.price);

  const allPrices = levels.map(l=>l.price).concat([price]);
  const min = Math.min(...allPrices)*0.985;
  const max = Math.max(...allPrices)*1.015;
  const range = max-min||1;
  const pricePct = ((price-min)/range*100).toFixed(1);

  const strengthColor = (s,C) => s==="strong"?C.txt:s==="moderate"?C.ts:C.tm;

  return(
    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1}}>SUPPORT & RESISTANCE</div>
        <div style={{fontFamily:M,fontSize:8,color:C.tm,background:C.bL,padding:"2px 6px",borderRadius:3}}>{source}</div>
      </div>

      {/* Visual price position bar */}
      <div style={{position:"relative",marginBottom:12}}>
        <div style={{height:6,background:C.bL,borderRadius:3,position:"relative",overflow:"visible"}}>
          {/* Level ticks */}
          {levels.map((l,i)=>{
            const lPct = ((l.price-min)/range*100).toFixed(1);
            return(
              <div key={i} style={{
                position:"absolute",left:`${lPct}%`,transform:"translateX(-50%)",
                width:2,height:6,
                background:l.type==="resistance"?C.red+"77":C.grn+"77",
                borderRadius:1,
              }}/>
            );
          })}
          {/* Current price indicator */}
          <div style={{
            position:"absolute",left:`${pricePct}%`,top:-4,
            width:14,height:14,borderRadius:"50%",
            background:C.mint,border:`2px solid ${C.bg}`,
            transform:"translateX(-50%)",
            zIndex:2,
            boxShadow:`0 0 6px ${C.mint}55`,
          }}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontFamily:M,fontSize:8,color:C.grn}}>${min.toFixed(2)}</span>
          <span style={{fontFamily:M,fontSize:8,color:C.ts}}>{pricePct}% range</span>
          <span style={{fontFamily:M,fontSize:8,color:C.red}}>${max.toFixed(2)}</span>
        </div>
      </div>

      {/* Resistance levels */}
      {resistances.length>0&&(
        <div style={{marginBottom:6}}>
          <div style={{fontFamily:M,fontSize:8,color:C.red,letterSpacing:.8,marginBottom:4}}>RESISTANCE</div>
          {resistances.slice(0,3).map((l,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:i<resistances.slice(0,3).length-1?`1px solid ${C.bL}`:"none"}}>
              <span style={{fontFamily:S,fontSize:10,color:strengthColor(l.strength,C)}}>{l.name}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontFamily:M,fontSize:10,fontWeight:600}}>${l.price?.toFixed(2)}</span>
                <span style={{fontFamily:M,fontSize:9,color:C.red,minWidth:40,textAlign:"right"}}>+{((l.price/price-1)*100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current price */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",background:C.mint+"14",border:`1px solid ${C.mint}22`,borderRadius:4,marginBottom:6}}>
        <span style={{fontFamily:M,fontSize:10,fontWeight:600,color:C.mint}}>PRICE NOW</span>
        <span style={{fontFamily:M,fontSize:11,fontWeight:700}}>${price?.toFixed(2)}</span>
      </div>

      {/* Support levels */}
      {supports.length>0&&(
        <div>
          <div style={{fontFamily:M,fontSize:8,color:C.grn,letterSpacing:.8,marginBottom:4}}>SUPPORT</div>
          {supports.slice(0,3).map((l,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:i<supports.slice(0,3).length-1?`1px solid ${C.bL}`:"none"}}>
              <span style={{fontFamily:S,fontSize:10,color:strengthColor(l.strength,C)}}>{l.name}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontFamily:M,fontSize:10,fontWeight:600}}>${l.price?.toFixed(2)}</span>
                <span style={{fontFamily:M,fontSize:9,color:C.grn,minWidth:40,textAlign:"right"}}>{((l.price/price-1)*100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {levels.length===0&&(
        <div style={{fontFamily:M,fontSize:10,color:C.tm,padding:"8px 0",textAlign:"center"}}>
          No level data — add /api/levels/{"{ticker}"} for Polygon SMA levels
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App(){
  const[themeId,setThemeIdState]=useState(()=>{try{return window._atlasTheme||"dark"}catch(e){return"dark"}});
  const C=THEMES[themeId]||THEMES.dark;
  const dc=(v,inv)=>dcc(v,inv,C);
  const switchTheme=(id)=>{setThemeIdState(id);setThemeId(id)};

  const[page,setPage]=useState("radar");
  const[scan,setScan]=useState("STOCKS");
  const[sel,setSel]=useState(0);
  const[tab,setTab]=useState("plan");
  const[capital,setCapital]=useState(3500);
  const[chartTk,setChartTk]=useState("");
  const[chartSym,setChartSym]=useState("");
  const[aTk,setATk]=useState("");
  const[aData,setAData]=useState(null);
  const[aLoading,setALoading]=useState(false);
  const[aShorts,setAShorts]=useState(null);
  const[aRelated,setARelated]=useState(null);
  const[aNews,setANews]=useState(null);
  const[aAnalysts,setAAnalysts]=useState(null);
  const[aFinancials,setAFinancials]=useState(null);
  const[aDividends,setADividends]=useState(null);
  const[aLevels,setALevels]=useState(null);          // NEW ③
  const[time,setTime]=useState(new Date());
  const[gate,setGate]=useState(null);
  const[pulse,setPulse]=useState(null);
  const[overview,setOverview]=useState(null);
  const[news,setNews]=useState(null);
  const[earnings,setEarnings]=useState(null);
  const[scanData,setScanData]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t)},[]);

  const load=useCallback(async()=>{
    const[g,p,o,n,e]=await Promise.all([api("/api/gate"),api("/api/pulse"),api("/api/overview"),api("/api/news"),api("/api/earnings")]);
    if(g)setGate(g);if(p)setPulse(p);if(o)setOverview(o);if(n?.news)setNews(n.news);if(e?.earnings)setEarnings(e.earnings);
  },[]);

  const doScan=useCallback(async m=>{
    setLoading(true);setSel(0);
    const d=await api("/api/scan/"+m.toLowerCase());
    if(d)setScanData(d);
    setLoading(false);
  },[]);

  // ── MODIFIED: doAnalyze now also fetches /api/levels ──
  const doAnalyze=useCallback(async ticker=>{
    if(!ticker)return;
    setALoading(true);
    setAData(null);setAShorts(null);setARelated(null);setANews(null);
    setAAnalysts(null);setAFinancials(null);setADividends(null);
    setALevels(null);  // NEW ③ clear

    const tk=ticker.toUpperCase();
    const[d,sh,rel,nw,an,fin,dv,lv]=await Promise.all([
      api("/api/analyze/"+tk),
      api("/api/shorts/"+tk),
      api("/api/related/"+tk),
      api("/api/ticker-news/"+tk),
      api("/api/analysts/"+tk),
      api("/api/financials/"+tk),
      api("/api/dividends/"+tk),
      api("/api/levels/"+tk),    // NEW ③ — Polygon SMA + pivot levels
    ]);
    if(d)setAData(d);
    if(sh)setAShorts(sh);
    if(rel)setARelated(rel);
    if(nw)setANews(nw);
    if(an)setAAnalysts(an);
    if(fin)setAFinancials(fin);
    if(dv)setADividends(dv);
    if(lv)setALevels(lv);        // NEW ③
    setALoading(false);
  },[]);

  useEffect(()=>{load();doScan(scan);const i=setInterval(load,300000);return()=>clearInterval(i)},[]);
  useEffect(()=>{doScan(scan)},[scan]);

  const sigs=scanData?.results||[];
  const hero=sigs[sel]||null;
  const mkt=gate?.market||{};
  const st=statusText(gate,C);
  const et=time.toLocaleString("en-US",{timeZone:"America/New_York",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
  const etd=time.toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",year:"numeric"});

  const lv=hero?.levels||{};
  const entry=lv.entry||0,stop=lv.stop||0;
  const shares=entry>0?Math.floor(capital/entry):0;
  const inv=shares*entry,risk=shares*(entry-stop);
  const s1=Math.floor(shares*.5),s2=Math.floor(shares*.3),s3=shares-s1-s2;
  const p1=s1*((lv.t1||0)-entry),p2=s2*((lv.t2||0)-entry),p3=s3*((lv.t3||0)-entry);
  const tp=p1+p2+p3,rr=risk>0?tp/risk:0;

  const navStyle=(id)=>({
    display:"flex",alignItems:"center",gap:10,width:"100%",marginBottom:2,
    padding:"9px 12px",borderRadius:6,border:"none",cursor:"pointer",
    background:page===id?C.mint+"18":"transparent",
    color:page===id?C.mint:C.ts+"88",
    fontFamily:S,fontSize:13,fontWeight:page===id?600:400,textAlign:"left",
    borderLeft:page===id?`2px solid ${C.mint}`:"2px solid transparent",
  });

  const btnAccent={padding:"10px 20px",borderRadius:6,border:"none",background:C.mint,color:"#000",fontFamily:M,fontSize:11,fontWeight:700,cursor:"pointer"};

  return(
    <div style={{display:"flex",height:"100vh",background:C.bg,color:C.txt,fontFamily:S,overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${C.b};border-radius:3px}
      `}</style>

      {/* ═══ SIDEBAR ═══ */}
      <div style={{width:170,background:C.sb,borderRight:`1px solid ${C.b}`,display:"flex",flexDirection:"column",padding:"12px 0",flexShrink:0}}>
        <div style={{padding:"0 14px 14px",display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${C.b}`}}>
          <div style={{width:24,height:24,background:C.mint,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#000",fontWeight:800}}>◈</div>
          <span style={{fontSize:15,fontWeight:700,letterSpacing:-.3}}>ATLAS</span>
        </div>
        <div style={{padding:"10px 8px 4px"}}>
          {[{id:"radar",icon:"◆",l:"Radar"},{id:"charts",icon:"◻",l:"Charts"},{id:"outlook",icon:"◎",l:"AtlasStonks"},{id:"guide",icon:"⚡",l:"Guide"},{id:"settings",icon:"⚙",l:"Settings"}].map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={navStyle(n.id)}>
              <span style={{fontSize:12,width:16,textAlign:"center",opacity:.6}}>{n.icon}</span>{n.l}
            </button>
          ))}
        </div>
        <div style={{padding:"12px 8px 4px"}}>
          <div style={{fontFamily:M,fontSize:9,fontWeight:500,letterSpacing:1.5,color:C.tm,padding:"0 8px",marginBottom:6,opacity:.5}}>UNIVERSE</div>
          {["STOCKS","CRYPTO","LEVERAGED"].map(m=>(
            <button key={m} onClick={()=>setScan(m)} style={{
              display:"block",width:"100%",marginBottom:2,padding:"7px 12px",
              borderRadius:5,border:"none",cursor:"pointer",textAlign:"left",
              background:scan===m?C.mint+"18":"transparent",color:scan===m?C.mint:C.ts+"66",
              fontFamily:M,fontSize:10,fontWeight:scan===m?600:400,letterSpacing:.8,
            }}>{m}</button>
          ))}
        </div>
        <div style={{margin:"auto 8px 0",padding:"10px",background:C.card,borderRadius:6,border:`1px solid ${C.b}`}}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:st.color,animation:"pulse 2s infinite"}}/>
            <span style={{fontFamily:M,fontSize:10,fontWeight:600,color:st.color}}>{gate?.status||"—"}</span>
          </div>
          <div style={{fontFamily:M,fontSize:9,color:C.tm,lineHeight:1.4}}>{gate?.count||0}/{gate?.total||4} checks passing</div>
          <div style={{fontFamily:M,fontSize:9,color:C.ts,marginTop:4}}>{scanData?.found||0} setups found</div>
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* STATUS BAR */}
        <div style={{background:st.bg,borderBottom:`1px solid ${C.b}`,padding:"0 20px",height:38,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:st.color,fontSize:8}}>●</span>
            <span style={{fontFamily:S,fontSize:12,fontWeight:600,color:st.color}}>{st.text}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {[{k:"sp_200ma",l:"S&P>200"},{k:"sp_50ma",l:"S&P>50"},{k:"vix_20",l:"VIX<20"},{k:"vix_25",l:"VIX<25"}].map((g,i)=>{
              const v=gate?.checks?.[g.k];
              return<span key={i} style={{fontFamily:M,fontSize:9,padding:"2px 6px",borderRadius:3,background:v?C.grnD:C.redD,color:v?C.grn:C.red,fontWeight:500}}>{v?"✓":"✗"} {g.l}</span>;
            })}
          </div>
        </div>

        {/* MARKET STRIP */}
        <div style={{background:C.sf,borderBottom:`1px solid ${C.b}`,padding:"0 20px",height:34,display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
          {pulse?.sp500?.price&&<span style={{fontFamily:M,fontSize:11}}>S&P <b style={{color:C.txt}}>{pulse.sp500.price.toLocaleString()}</b> <span style={{color:dc(pulse.sp500.change||0),fontSize:10}}>{pulse.sp500.change>0?"▲":"▼"}{Math.abs(pulse.sp500.change||0).toFixed(1)}%</span></span>}
          <span style={{color:C.b}}>·</span>
          {pulse?.vix?.value&&<span style={{fontFamily:M,fontSize:11}}>VIX <b style={{color:pulse.vix.value>25?C.red:C.txt}}>{pulse.vix.value}</b></span>}
          <span style={{color:C.b}}>·</span>
          {pulse?.fear_greed?.score!=null&&<span style={{fontFamily:M,fontSize:11}}>Fear <b style={{color:pulse.fear_greed.score<25?C.red:C.txt}}>{pulse.fear_greed.score}</b> <span style={{fontSize:10,color:pulse.fear_greed.score<25?C.red:C.ts}}>{pulse.fear_greed.score<25?"Extreme":pulse.fear_greed.label||""}</span></span>}
          <span style={{color:C.b}}>·</span>
          {pulse?.btc_dominance&&<span style={{fontFamily:M,fontSize:11}}>BTC.D <b>{pulse.btc_dominance}%</b></span>}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:mkt.is_open?C.grn:mkt.after_hours?"#F59E0B":C.tm,animation:mkt.is_open?"pulse 2s infinite":"none"}}/>
              <span style={{fontFamily:M,fontSize:10,color:mkt.is_open?C.grn:mkt.after_hours?"#F59E0B":C.tm}}>{mkt.is_open?"Open":mkt.after_hours?"After Hours":mkt.early_hours?"Pre-Market":"Closed"}</span>
            </div>
            <span style={{fontFamily:M,fontSize:10,color:C.ts}}>{et} · {etd}</span>
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{flex:1,overflow:"auto",padding:"10px 14px"}}>

          {/* ═══ RADAR ═══ */}
          {page==="radar"&&(
            <div style={{animation:"fadeIn .2s ease"}}>
              {loading&&!hero?(
                <div style={{textAlign:"center",padding:"60px"}}><div style={{fontSize:24,color:C.mint,opacity:.3,marginBottom:10}}>◈</div><div style={{fontFamily:M,fontSize:12,color:C.ts}}>Scanning {scan.toLowerCase()}...</div></div>
              ):hero?(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 270px",gap:10,marginBottom:10}}>
                    {/* LEFT: CHART */}
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"12px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontFamily:M,fontSize:10,color:C.tm,background:C.bL,padding:"2px 6px",borderRadius:3}}>#{hero.rank||1}</span>
                          <div>
                            <span style={{fontSize:18,fontWeight:700}}>{hero.ticker}</span>
                            {hero.name&&hero.name!==hero.ticker&&<div style={{fontFamily:S,fontSize:10,color:C.ts,marginTop:1}}>{hero.name}</div>}
                          </div>
                          <Pill sig={hero.signal} C={C}/>
                          {hero.clear&&<span style={{fontFamily:M,fontSize:9,color:C.grn,background:C.grnD,padding:"2px 7px",borderRadius:3}}>✓ No Earnings</span>}
                        </div>
                        <div style={{display:"flex",gap:2}}>
                          {["1M","3M","6M","1Y"].map((p,i)=>(
                            <button key={p} style={{padding:"3px 8px",borderRadius:4,border:`1px solid ${i===2?C.mint+"33":C.b}`,background:i===2?C.mint+"18":"transparent",color:i===2?C.mint:C.tm,fontFamily:M,fontSize:9,cursor:"pointer"}}>{p}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:6}}>
                        <span style={{fontFamily:M,fontSize:22,fontWeight:700}}>{fmt(hero.price)}</span>
                        <span style={{fontFamily:M,fontSize:11,color:dc(hero.change||0)}}>{hero.change>0?"▲":"▼"} {Math.abs(hero.change||0).toFixed(2)}%</span>
                        <div style={{marginLeft:"auto",display:"flex",gap:12,fontFamily:M,fontSize:10,color:C.ts}}>
                          <span>RSI <b style={{color:(hero.indicators?.rsi||50)<30?C.grn:(hero.indicators?.rsi||50)>70?C.red:C.txt}}>{hero.indicators?.rsi||"—"}</b></span>
                          <span>ADX <b style={{color:C.txt}}>{hero.indicators?.adx||"—"}</b></span>
                          <span>MFI <b style={{color:(hero.indicators?.mfi||0)>50?C.grn:C.txt}}>{hero.indicators?.mfi||"—"}</b></span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={185}>
                        <AreaChart data={(hero.sparkline||[]).map((p,i)=>({i,p}))}>
                          <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.mint} stopOpacity={.12}/><stop offset="100%" stopColor={C.mint} stopOpacity={0}/></linearGradient></defs>
                          <XAxis dataKey="i" tick={{fill:C.tm,fontSize:9,fontFamily:M}} axisLine={{stroke:C.bL}} tickLine={false} interval={9}/>
                          <YAxis tick={{fill:C.tm,fontSize:9,fontFamily:M}} axisLine={false} tickLine={false} width={44} domain={["auto","auto"]}/>
                          <Tooltip content={Tip}/>
                          <Area type="monotone" dataKey="p" stroke={C.mint} strokeWidth={1.5} fill="url(#hg)" dot={false}/>
                        </AreaChart>
                      </ResponsiveContainer>
                      <ResponsiveContainer width="100%" height={20}>
                        <BarChart data={(hero.sparkline||[]).map((p,i)=>({i,v:Math.random()*60+20}))}>
                          <Bar dataKey="v" fill={C.mint+"15"} radius={[1,1,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,padding:"6px 10px",background:C.sf,borderRadius:5,border:`1px solid ${C.bL}`}}>
                        <span style={{fontFamily:M,fontSize:10,color:C.mint,fontWeight:600}}>WHY</span>
                        <span style={{fontFamily:S,fontSize:11,color:C.ts,flex:1}}>{hero.reason||"Analyzing..."}</span>
                        <div style={{display:"flex",alignItems:"center",gap:3,background:C.mint+"18",padding:"2px 8px",borderRadius:3}}>
                          <span style={{color:C.grn,fontSize:9}}>↑</span>
                          <span style={{fontFamily:M,fontSize:11,fontWeight:700}}>${(hero.chip||0).toLocaleString()}</span>
                        </div>
                      </div>
                      {sigs.length>1&&(
                        <div style={{display:"flex",gap:6,marginTop:8,overflowX:"auto",paddingBottom:2}}>
                          {sigs.filter((_,i)=>i!==sel).slice(0,6).map((r,i)=>(
                            <div key={i} onClick={()=>setSel(sigs.indexOf(r))} style={{flex:"0 0 auto",background:C.sf,border:`1px solid ${C.bL}`,borderRadius:5,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,minWidth:160}}
                              onMouseEnter={e=>e.currentTarget.style.borderColor=C.mint+"33"}
                              onMouseLeave={e=>e.currentTarget.style.borderColor=C.bL}>
                              <div>
                                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:1}}>
                                  <span style={{fontFamily:M,fontSize:11,fontWeight:600}}>{r.ticker}</span>
                                  <Pill sig={r.signal} sm C={C}/>
                                </div>
                                <div style={{fontFamily:M,fontSize:10,color:C.ts}}>{fmt(r.price)} <span style={{color:dc(r.change||0),fontSize:9}}>{pf(r.change||0)}</span></div>
                              </div>
                              <div style={{width:55}}><Spark data={r.sparkline} color={dc(r.change||0)} w={55} h={20}/></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: TRADE PANEL */}
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <div style={{display:"flex",background:C.sf,borderRadius:5,padding:2,border:`1px solid ${C.b}`}}>
                        {[{id:"plan",l:"Trade Plan"},{id:"calc",l:"Profit Calc"}].map(t=>(
                          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"5px 0",borderRadius:4,border:"none",cursor:"pointer",background:tab===t.id?C.mint+"18":"transparent",color:tab===t.id?C.mint:C.ts,fontFamily:M,fontSize:10,fontWeight:600}}>{t.l}</button>
                        ))}
                      </div>
                      {tab==="plan"&&(
                        <>
                          <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:7,padding:"10px 12px"}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:6}}>
                              <div style={{background:C.sf,border:`1px solid ${C.bL}`,borderRadius:5,padding:"7px 10px"}}>
                                <div style={{fontFamily:M,fontSize:9,color:C.ts,marginBottom:1}}>Entry</div>
                                <div style={{fontFamily:M,fontSize:14,fontWeight:600}}>{fmt(entry)}</div>
                              </div>
                              <div style={{background:C.sf,border:`1px solid ${C.bL}`,borderRadius:5,padding:"7px 10px"}}>
                                <div style={{fontFamily:M,fontSize:9,color:C.ts,marginBottom:1}}>Stop −5%</div>
                                <div style={{fontFamily:M,fontSize:14,fontWeight:600,color:C.red}}>{fmt(stop)}</div>
                              </div>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:6}}>
                              {[{l:"T1 +8%",v:lv.t1,c:C.mint},{l:"T2 +15%",v:lv.t2,c:C.grn},{l:"T3 +20%",v:lv.t3,c:C.grn}].map((t,i)=>(
                                <div key={i} style={{background:C.sf,border:`1px solid ${C.bL}`,borderRadius:4,padding:"5px 6px",textAlign:"center"}}>
                                  <div style={{fontFamily:M,fontSize:8,color:C.tm,marginBottom:1}}>{t.l}</div>
                                  <div style={{fontFamily:M,fontSize:12,fontWeight:700,color:t.c}}>{fmt(t.v||0)}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,padding:"7px 0 0",borderTop:`1px solid ${C.bL}`}}>
                              <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>Shares</div><div style={{fontFamily:M,fontSize:15,fontWeight:700}}>{entry>0?Math.floor((hero.chip||0)/entry):0}</div></div>
                              <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>Risk</div><div style={{fontFamily:M,fontSize:15,fontWeight:700,color:C.red}}>{fmt(risk)}</div></div>
                              <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>R:R</div><div style={{fontFamily:M,fontSize:15,fontWeight:700,color:rr>=2?C.mint:C.warn}}>1:{rr.toFixed(1)}</div></div>
                            </div>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                            <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:6,padding:"8px 4px",textAlign:"center"}}><Gauge value={hero.tech_score||0} size={70} label="Quality" color={(hero.tech_score||0)>=75?C.mint:C.ts} thick={5} C={C}/></div>
                            <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:6,padding:"8px 4px",textAlign:"center"}}><Gauge value={hero.catalyst_base||0} size={70} label="Conviction" color={(hero.catalyst_base||0)>=60?C.mint:C.tm} thick={5} C={C}/></div>
                          </div>
                          <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:6,padding:"8px 10px"}}>
                            {tierChecklist(hero.tiers,C).map((t,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 0",borderBottom:i<3?`1px solid ${C.bL}`:"none"}}>
                                <span style={{fontSize:12,color:t.color,width:16,textAlign:"center"}}>{t.icon}</span>
                                <span style={{fontFamily:S,fontSize:11,color:t.color===C.grn?C.txt:t.color}}>{t.text}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {tab==="calc"&&(
                        <>
                          <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:7,padding:"10px 12px"}}>
                            <div style={{fontFamily:M,fontSize:10,color:C.ts,marginBottom:4}}>Capital to Deploy</div>
                            <input type="number" value={capital} onChange={e=>setCapital(Math.max(0,+e.target.value))} style={{width:"100%",background:C.sf,border:`1px solid ${C.b}`,borderRadius:5,padding:"6px 10px",fontFamily:M,fontSize:13,fontWeight:600,color:C.txt,outline:"none",textAlign:"right"}}/>
                            <input type="range" min={500} max={10000} step={100} value={capital} onChange={e=>setCapital(+e.target.value)} style={{width:"100%",marginTop:4,accentColor:C.mint,height:3}}/>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginTop:6}}>
                              <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>Shares</div><div style={{fontFamily:M,fontSize:13,fontWeight:700}}>{shares}</div></div>
                              <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>Invested</div><div style={{fontFamily:M,fontSize:13,fontWeight:700}}>{fmt(inv)}</div></div>
                              <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>Entry</div><div style={{fontFamily:M,fontSize:13,fontWeight:700}}>{fmt(entry)}</div></div>
                            </div>
                          </div>
                          <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:7,padding:"10px 12px"}}>
                            <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:6}}>STAGED EXIT</div>
                            {[{l:"T1 +8%",pct:"50%",sh:s1,pr:lv.t1,p:p1,c:C.mint},{l:"T2 +15%",pct:"30%",sh:s2,pr:lv.t2,p:p2,c:C.grn},{l:"T3 +20%",pct:"20%",sh:s3,pr:lv.t3,p:p3,c:C.grn}].map((s,i)=>(
                              <div key={i} style={{background:C.sf,border:`1px solid ${C.bL}`,borderRadius:5,padding:"6px 8px",marginBottom:3}}>
                                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                                  <div style={{display:"flex",gap:5}}><span style={{fontFamily:M,fontSize:10,fontWeight:600,color:s.c}}>{s.l}</span><span style={{fontFamily:M,fontSize:8,color:C.tm,background:C.bL,padding:"1px 4px",borderRadius:2}}>Sell {s.pct}</span></div>
                                  <span style={{fontFamily:M,fontSize:11,fontWeight:700,color:s.c}}>+{fmt(s.p)}</span>
                                </div>
                                <div style={{fontFamily:M,fontSize:9,color:C.ts}}>{s.sh} shares @ {fmt(s.pr||0)}</div>
                                <div style={{height:2,background:C.bL,borderRadius:1,marginTop:3,overflow:"hidden"}}><div style={{height:2,width:`${tp>0?s.p/tp*100:0}%`,background:s.c,borderRadius:1,transition:"width .4s"}}/></div>
                              </div>
                            ))}
                          </div>
                          <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:7,padding:"10px 12px"}}>
                            <div style={{display:"flex",height:16,borderRadius:3,overflow:"hidden",marginBottom:6}}>
                              <div style={{width:`${risk+tp>0?risk/(risk+tp)*100:50}%`,background:C.red+"40",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:M,fontSize:8,color:C.red,minWidth:30}}>{fmt(risk)}</div>
                              <div style={{flex:1,background:C.mint+"20",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:M,fontSize:8,color:C.mint}}>{fmt(tp)}</div>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
                              <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>Return</div><div style={{fontFamily:M,fontSize:14,fontWeight:700,color:C.mint}}>+{(inv>0?tp/inv*100:0).toFixed(1)}%</div></div>
                              <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>R:R</div><div style={{fontFamily:M,fontSize:14,fontWeight:700,color:rr>=2?C.mint:C.warn}}>1:{rr.toFixed(1)}</div></div>
                              <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>Max Loss</div><div style={{fontFamily:M,fontSize:14,fontWeight:700,color:C.red}}>-{fmt(risk)}</div></div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM GRID */}
                  <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr 1.2fr",gap:8}}>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:7,padding:"10px 12px",maxHeight:280,overflow:"auto"}}>
                      <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>Other Setups</div>
                      {sigs.filter((_,i)=>i!==sel).slice(0,10).map((r,i)=>(
                        <div key={i} onClick={()=>setSel(sigs.indexOf(r))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.bL}`,cursor:"pointer"}}
                          onMouseEnter={e=>e.currentTarget.style.opacity=".7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                          <div style={{display:"flex",alignItems:"center",gap:5}}>
                            <span style={{fontFamily:M,fontSize:11,fontWeight:600,minWidth:32}}>{r.ticker}</span>
                            <Pill sig={r.signal} sm C={C}/>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <span style={{fontFamily:M,fontSize:11,fontWeight:600}}>{fmt(r.price)}</span>
                            <span style={{fontFamily:M,fontSize:9,color:dc(r.change||0),marginLeft:4}}>{pf(r.change||0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:7,padding:"10px 12px"}}>
                      <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>Earnings This Week</div>
                      {(earnings||[]).slice(0,6).map((e,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.bL}`}}>
                          <div style={{display:"flex",gap:6}}>
                            <span style={{fontFamily:M,fontSize:10,color:C.tm}}>{(e.date||"").slice(5)}</span>
                            <span style={{fontFamily:M,fontSize:11,fontWeight:600}}>{e.ticker}</span>
                          </div>
                          <span style={{fontFamily:M,fontSize:9,color:C.ts}}>{e.hour||""}</span>
                        </div>
                      ))}
                      {(!earnings||!earnings.length)&&<div style={{fontFamily:M,fontSize:10,color:C.tm,padding:"8px 0"}}>No earnings this week</div>}
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:7,padding:"10px 12px"}}>
                      <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>Markets</div>
                      {Object.entries(overview?.indexes||{}).map(([name,d],i,arr)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0",borderBottom:i<arr.length-1?`1px solid ${C.bL}`:"none"}}>
                          <span style={{fontFamily:M,fontSize:10,color:C.ts}}>{name}</span>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontFamily:M,fontSize:11,fontWeight:600}}>{d.price!=null?(d.price>=1000?"$"+d.price.toLocaleString("en-US",{maximumFractionDigits:0}):d.price>=100?"$"+d.price.toFixed(0):d.price.toFixed(2)):"—"}</span>
                            {d.change!=null&&<span style={{fontFamily:M,fontSize:9,color:dc(d.change,name==="VIX")}}>{d.change>0?"▲":"▼"}{Math.abs(d.change).toFixed(1)}%</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:7,padding:"10px 12px"}}>
                      <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>Macro News</div>
                      {(news||[]).map((n,i)=>{
                        const tag=newsTag(n.sentiment,C);
                        return(
                          <div key={i} style={{padding:"5px 0",borderBottom:`1px solid ${C.bL}`}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                              <span style={{fontFamily:S,fontSize:11,color:C.ts,flex:1,lineHeight:1.4}}>{n.text}</span>
                              <span style={{fontFamily:M,fontSize:8,color:tag.color,background:tag.bg,padding:"2px 6px",borderRadius:3,whiteSpace:"nowrap",flexShrink:0}}>{tag.label}</span>
                            </div>
                          </div>
                        );
                      })}
                      {(!news||!news.length)&&<div style={{fontFamily:M,fontSize:10,color:C.tm,padding:"8px 0"}}>No macro news</div>}
                    </div>
                  </div>
                </>
              ):(
                <div style={{textAlign:"center",padding:"50px",background:C.card,borderRadius:8,border:`1px solid ${C.b}`}}>
                  <div style={{fontSize:20,color:C.mint,opacity:.3,marginBottom:8}}>◆</div>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>No setups found</div>
                  <div style={{fontSize:12,color:C.tm}}>Try a different universe or check back later</div>
                </div>
              )}
            </div>
          )}

          {/* ═══ CHARTS ═══ */}
          {page==="charts"&&(
            <div style={{animation:"fadeIn .2s"}}>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={chartTk} onChange={e=>setChartTk(e.target.value.toUpperCase())} onKeyDown={e=>{if(e.key==="Enter"&&chartTk)setChartSym(chartTk)}} placeholder="Enter ticker — NVDA, AAPL, BTCUSD, ETHUSD..." style={{flex:1,maxWidth:400,padding:"10px 14px",borderRadius:6,background:C.card,border:`1px solid ${C.b}`,color:C.txt,fontFamily:M,fontSize:12,outline:"none"}} onFocus={e=>e.target.style.borderColor=C.mint} onBlur={e=>e.target.style.borderColor=C.b}/>
                <button onClick={()=>{if(chartTk)setChartSym(chartTk)}} style={btnAccent}>→ Load Chart</button>
                {["NVDA","AAPL","TSLA","BTCUSD","SPY"].map(t=>(
                  <button key={t} onClick={()=>{setChartTk(t);setChartSym(t)}} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${C.b}`,background:chartSym===t?C.mint+"18":C.card,color:chartSym===t?C.mint:C.ts,fontFamily:M,fontSize:10,cursor:"pointer"}}>{t}</button>
                ))}
              </div>
              <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,overflow:"hidden",height:"calc(100vh - 220px)",minHeight:450}}>
                {chartSym?(
                  <TVChart symbol={chartSym} theme="dark"/>
                ):(
                  <div style={{textAlign:"center",padding:"60px"}}>
                    <div style={{fontSize:24,color:C.mint,opacity:.3,marginBottom:8}}>◻</div>
                    <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Chart Station</div>
                    <div style={{fontSize:12,color:C.tm}}>Enter any ticker above or click a quick symbol</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ ATLASSTONKS ═══ */}
          {page==="outlook"&&(
            <div style={{animation:"fadeIn .2s"}}>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input value={aTk} onChange={e=>setATk(e.target.value.toUpperCase())} onKeyDown={e=>{if(e.key==="Enter")doAnalyze(aTk)}} placeholder="Type ticker — AAPL, NVDA, MSFT, BTC-USD..." style={{flex:1,maxWidth:400,padding:"10px 14px",borderRadius:6,background:C.card,border:`1px solid ${C.b}`,color:C.txt,fontFamily:M,fontSize:12,outline:"none"}} onFocus={e=>e.target.style.borderColor=C.mint} onBlur={e=>e.target.style.borderColor=C.b}/>
                <button onClick={()=>doAnalyze(aTk)} style={btnAccent}>→ Analyze</button>
              </div>

              {aLoading&&<div style={{textAlign:"center",padding:"40px",fontFamily:M,fontSize:12,color:C.ts}}>Analyzing {aTk}...</div>}

              {!aLoading&&!aData&&<div style={{textAlign:"center",padding:"50px",background:C.card,borderRadius:8,border:`1px solid ${C.b}`}}>
                <div style={{fontSize:24,color:C.lav,opacity:.3,marginBottom:8}}>◎</div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>AtlasStonks — Deep Ticker Analysis</div>
                <div style={{fontSize:12,color:C.tm,marginBottom:8}}>Full research — financials, earnings, analyst ratings, insider activity, valuation, price outlook</div>
                <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
                  {["NVDA","AAPL","MSFT","META","TSLA","AMZN"].map(t=>(
                    <button key={t} onClick={()=>{setATk(t);doAnalyze(t)}} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${C.b}`,background:C.sf,color:C.ts,fontFamily:M,fontSize:10,cursor:"pointer"}}>{t}</button>
                  ))}
                </div>
              </div>}

              {aData&&(()=>{
                const d=aData;const pr=d.profile||{};const px=d.price||{};const fin=d.financials||{};
                const earn=d.earnings||{};const an=d.analysts||{};const ins=d.insiders||{};
                const val=d.valuation||{};const div=d.dividend||{};const rt=d.rating||{};
                const ol=d.outlook||{};const at=d.atlas_score||{};const sc=fin.scorecard||[];
                const rtColor=rt.overall==="BUY"?C.grn:rt.overall==="SELL"?C.red:C.warn;
                const fmtB=v=>{if(!v)return"—";if(v>=1e12)return"$"+(v/1e12).toFixed(1)+"T";if(v>=1e9)return"$"+(v/1e9).toFixed(1)+"B";if(v>=1e6)return"$"+(v/1e6).toFixed(0)+"M";return"$"+v.toLocaleString()};
                const stColor=s=>s==="good"?C.grn:s==="warn"?C.warn:s==="bad"?C.red:C.ts;

                return(<>
                  {/* Header row */}
                  <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"14px 18px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                        <span style={{fontSize:20,fontWeight:700}}>{pr.name||d.ticker}</span>
                        <span style={{fontFamily:M,fontSize:11,color:C.ts}}>{d.ticker}</span>
                        <span style={{fontFamily:M,fontSize:9,color:C.tm,background:C.bL,padding:"2px 6px",borderRadius:3}}>{pr.exchange}</span>
                        <span style={{fontFamily:M,fontSize:9,color:C.tm,background:C.bL,padding:"2px 6px",borderRadius:3}}>{pr.sector}</span>
                      </div>
                      <div style={{fontSize:11,color:C.ts,maxWidth:500}}>{pr.description}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:M,fontSize:24,fontWeight:700}}>{px.current?"$"+px.current.toLocaleString():"—"}</div>
                      <div style={{fontFamily:M,fontSize:12,color:dc(px.change_pct||0)}}>{px.change_pct>0?"▲":"▼"} {Math.abs(px.change_pct||0).toFixed(2)}% ({px.change>0?"+":""}{(px.change||0).toFixed(2)})</div>
                      <div style={{fontFamily:M,fontSize:10,color:C.tm,marginTop:4}}>Mkt Cap {fmtB(pr.market_cap)}</div>
                    </div>
                  </div>

                  {/* 52W range + rating */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:10}}>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 16px"}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,marginBottom:6}}>52-WEEK RANGE</div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontFamily:M,fontSize:10,color:C.red}}>${px.low_52w||"—"}</span>
                        <div style={{flex:1,height:6,background:C.bL,borderRadius:3,position:"relative"}}>
                          <div style={{position:"absolute",left:`${px.range_pct||50}%`,top:-2,width:10,height:10,borderRadius:"50%",background:C.mint,border:`2px solid ${C.bg}`,transform:"translateX(-50%)"}}/>
                          <div style={{height:6,width:`${px.range_pct||50}%`,background:`linear-gradient(90deg,${C.red}44,${C.grn}44)`,borderRadius:3}}/>
                        </div>
                        <span style={{fontFamily:M,fontSize:10,color:C.grn}}>${px.high_52w||"—"}</span>
                      </div>
                      <div style={{fontFamily:M,fontSize:9,color:C.ts,marginTop:4,textAlign:"center"}}>{px.range_pct||"—"}% from 52w low</div>
                    </div>
                    <div style={{background:rtColor+"15",border:`1px solid ${rtColor}33`,borderRadius:8,padding:"12px 24px",textAlign:"center",minWidth:140}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,marginBottom:4}}>OVERALL RATING</div>
                      <div style={{fontFamily:M,fontSize:28,fontWeight:700,color:rtColor}}>{rt.overall||"—"}</div>
                      <div style={{fontFamily:M,fontSize:10,color:C.ts}}>Confidence {rt.confidence||0}%</div>
                    </div>
                  </div>

                  {/* Fundamentals grid */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:8}}>FINANCIALS</div>
                      {sc.length>0?sc.map((s,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:i<sc.length-1?`1px solid ${C.bL}`:"none"}}>
                          <span style={{fontSize:11,color:C.ts}}>{s.name}</span>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontFamily:M,fontSize:11,fontWeight:600,color:stColor(s.status)}}>{s.value}</span>
                            <span style={{fontSize:10,color:stColor(s.status)}}>{s.status==="good"?"✓":s.status==="warn"?"◐":"✗"}</span>
                          </div>
                        </div>
                      )):<div style={{fontFamily:M,fontSize:10,color:C.tm}}>No financial data</div>}
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:8}}>EARNINGS</div>
                      {earn.next_date&&<div style={{fontFamily:M,fontSize:10,color:C.warn,marginBottom:6,padding:"3px 6px",background:C.warn+"12",borderRadius:3,display:"inline-block"}}>Next: {earn.next_date}</div>}
                      <div style={{fontFamily:M,fontSize:11,color:C.ts,marginBottom:8}}>{earn.beats||0}/{earn.total||0} beats last {earn.total||0} quarters</div>
                      {(earn.history||[]).map((q,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:i<(earn.history||[]).length-1?`1px solid ${C.bL}`:"none"}}>
                          <span style={{fontFamily:M,fontSize:10,color:C.tm}}>{(q.date||"").slice(0,7)}</span>
                          <span style={{fontFamily:M,fontSize:10}}>${q.actual}</span>
                          <span style={{fontFamily:M,fontSize:10,fontWeight:600,color:q.beat?C.grn:C.red}}>{q.beat?"BEAT":"MISS"} {q.surprise>0?"+":""}{q.surprise}%</span>
                        </div>
                      ))}
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:8}}>ANALYSTS & INSIDERS</div>
                      {an.total>0&&<>
                        <div style={{display:"flex",gap:4,marginBottom:6}}>
                          <div style={{flex:an.buy||1,height:8,background:C.grn,borderRadius:"3px 0 0 3px"}}/>
                          <div style={{flex:an.hold||1,height:8,background:C.warn}}/>
                          <div style={{flex:an.sell||1,height:8,background:C.red,borderRadius:"0 3px 3px 0"}}/>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontFamily:M,fontSize:10,marginBottom:4}}>
                          <span style={{color:C.grn}}>{an.buy} Buy</span><span style={{color:C.warn}}>{an.hold} Hold</span><span style={{color:C.red}}>{an.sell} Sell</span>
                        </div>
                      </>}
                      {an.target_median&&<div style={{fontFamily:M,fontSize:11,color:C.ts,padding:"4px 0",borderTop:`1px solid ${C.bL}`}}>Target <b style={{color:C.txt}}>${an.target_median}</b> {an.upside&&<span style={{color:an.upside>0?C.grn:C.red}}>({an.upside>0?"+":""}{an.upside}%)</span>}</div>}
                      {an.target_high&&<div style={{fontFamily:M,fontSize:9,color:C.tm}}>Range ${an.target_low} — ${an.target_high}</div>}
                      <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.bL}`}}>
                        <div style={{fontFamily:M,fontSize:9,color:C.tm,marginBottom:4}}>INSIDER ACTIVITY (90D)</div>
                        <div style={{display:"flex",gap:12,fontFamily:M,fontSize:11}}>
                          <span style={{color:C.grn}}>{ins.buys_90d||0} Buys</span><span style={{color:C.red}}>{ins.sells_90d||0} Sells</span>
                          <span style={{color:ins.signal==="BULLISH"?C.grn:ins.signal==="NEGATIVE"?C.red:C.ts,fontWeight:600}}>{ins.signal||"—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Valuation + Outlook */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:8}}>VALUATION</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
                        <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>P/E Now</div><div style={{fontFamily:M,fontSize:15,fontWeight:700}}>{val.pe||fin.pe||"—"}</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>P/E 5Y Avg</div><div style={{fontFamily:M,fontSize:15,fontWeight:700}}>{val.pe_5y_avg||"—"}</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontFamily:M,fontSize:9,color:C.tm}}>PEG</div><div style={{fontFamily:M,fontSize:15,fontWeight:700}}>{val.peg||"—"}</div></div>
                      </div>
                      <div style={{textAlign:"center",padding:"4px 8px",borderRadius:4,background:val.status==="UNDERVALUED"?C.grnD:val.status==="OVERVALUED"?C.redD:C.bL,fontFamily:M,fontSize:10,fontWeight:600,color:val.status==="UNDERVALUED"?C.grn:val.status==="OVERVALUED"?C.red:C.ts,marginBottom:8}}>{val.status||"—"}</div>
                      <div style={{borderTop:`1px solid ${C.bL}`,paddingTop:8}}>
                        <div style={{fontFamily:M,fontSize:9,color:C.tm,marginBottom:4}}>DIVIDEND</div>
                        {div.pays?<div style={{fontFamily:M,fontSize:11}}>${div.annual}/yr · <span style={{color:C.mint}}>{div.yield}% yield</span></div>:<div style={{fontFamily:M,fontSize:10,color:C.tm}}>No dividend</div>}
                      </div>
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:8}}>PRICE OUTLOOK</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                        <div style={{background:C.sf,border:`1px solid ${C.bL}`,borderRadius:6,padding:"8px 10px",textAlign:"center"}}>
                          <div style={{fontFamily:M,fontSize:9,color:C.tm}}>1 YEAR</div>
                          <div style={{fontFamily:M,fontSize:18,fontWeight:700,color:(ol.return_1y||0)>0?C.grn:C.red}}>${ol.price_1y||"—"}</div>
                          <div style={{fontFamily:M,fontSize:10,color:(ol.return_1y||0)>0?C.grn:C.red}}>{(ol.return_1y||0)>0?"+":""}{ol.return_1y||0}%</div>
                        </div>
                        <div style={{background:C.sf,border:`1px solid ${C.bL}`,borderRadius:6,padding:"8px 10px",textAlign:"center"}}>
                          <div style={{fontFamily:M,fontSize:9,color:C.tm}}>5 YEAR</div>
                          <div style={{fontFamily:M,fontSize:18,fontWeight:700,color:(ol.return_5y||0)>0?C.grn:C.red}}>${ol.price_5y||"—"}</div>
                          <div style={{fontFamily:M,fontSize:10,color:(ol.return_5y||0)>0?C.grn:C.red}}>{(ol.return_5y||0)>0?"+":""}{ol.return_5y||0}%</div>
                        </div>
                      </div>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm}}>Based on {ol.basis||"available data"}</div>
                      {at.signal&&<div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.bL}`}}>
                        <div style={{fontFamily:M,fontSize:9,color:C.tm,marginBottom:4}}>ATLAS TECHNICAL</div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}><Pill sig={at.signal} C={C}/><span style={{fontFamily:M,fontSize:11}}>Score {at.tech_score}/100</span></div>
                        <div style={{fontFamily:S,fontSize:10,color:C.ts,marginTop:4}}>{at.reason}</div>
                      </div>}
                    </div>
                  </div>

                  {/* Existing Polygon panels */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:10}}>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:8}}>SHORT INTEREST</div>
                      {aShorts&&(aShorts.short_volume||aShorts.short_interest)?(<>
                        {aShorts.short_volume&&<>
                          <div style={{fontFamily:M,fontSize:11,color:C.ts,marginBottom:4}}>Short Volume Ratio</div>
                          <div style={{fontFamily:M,fontSize:20,fontWeight:700,color:(aShorts.short_volume.ratio||0)>40?C.warn:C.ts,marginBottom:6}}>{aShorts.short_volume.ratio||"—"}%</div>
                          <div style={{height:4,background:C.bL,borderRadius:2,overflow:"hidden",marginBottom:4}}>
                            <div style={{height:4,width:`${Math.min(aShorts.short_volume.ratio||0,100)}%`,background:(aShorts.short_volume.ratio||0)>50?C.red:(aShorts.short_volume.ratio||0)>40?C.warn:C.grn,borderRadius:2}}/>
                          </div>
                          <div style={{fontFamily:M,fontSize:9,color:C.tm}}>{aShorts.short_volume.date||""}</div>
                        </>}
                        {aShorts.short_interest&&<div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${C.bL}`}}>
                          <div style={{fontFamily:M,fontSize:9,color:C.tm}}>Short Interest</div>
                          <div style={{fontFamily:M,fontSize:11,fontWeight:600}}>{(aShorts.short_interest.short_interest||0).toLocaleString()}</div>
                        </div>}
                      </>):<div style={{fontFamily:M,fontSize:10,color:C.tm}}>No short data</div>}
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:8}}>ANALYST RATINGS</div>
                      {aAnalysts&&aAnalysts.consensus?(<>
                        <div style={{fontFamily:M,fontSize:14,fontWeight:700,color:aAnalysts.consensus.consensus==="Buy"||aAnalysts.consensus.consensus==="Outperform"?C.grn:aAnalysts.consensus.consensus==="Sell"?C.red:C.warn,marginBottom:6}}>{aAnalysts.consensus.consensus||"—"}</div>
                        <div style={{display:"flex",gap:8,fontFamily:M,fontSize:10,marginBottom:6}}>
                          <span style={{color:C.grn}}>{aAnalysts.consensus.buy||0} Buy</span>
                          <span style={{color:C.warn}}>{aAnalysts.consensus.hold||0} Hold</span>
                          <span style={{color:C.red}}>{aAnalysts.consensus.sell||0} Sell</span>
                        </div>
                        {aAnalysts.consensus.target_mean&&<div style={{fontFamily:M,fontSize:10,color:C.ts}}>Target ${aAnalysts.consensus.target_mean}</div>}
                      </>):aAnalysts&&aAnalysts.ratings&&aAnalysts.ratings.length>0?(<>
                        {aAnalysts.ratings.slice(0,4).map((r,i)=>(
                          <div key={i} style={{padding:"3px 0",borderBottom:i<3?`1px solid ${C.bL}`:"none"}}>
                            <div style={{display:"flex",justifyContent:"space-between"}}>
                              <span style={{fontFamily:M,fontSize:10,color:C.ts}}>{r.firm||"Analyst"}</span>
                              <span style={{fontFamily:M,fontSize:10,fontWeight:600,color:r.rating?.toLowerCase().includes("buy")?C.grn:r.rating?.toLowerCase().includes("sell")?C.red:C.warn}}>{r.rating||""}</span>
                            </div>
                            {r.target&&<div style={{fontFamily:M,fontSize:9,color:C.tm}}>PT ${r.target}</div>}
                          </div>
                        ))}
                      </>):<div style={{fontFamily:M,fontSize:10,color:C.tm}}>No analyst data</div>}
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:8}}>RELATED TICKERS</div>
                      {aRelated&&aRelated.related&&aRelated.related.length>0?(
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          {aRelated.related.slice(0,8).map((t,i)=>(
                            <button key={i} onClick={()=>{setATk(t);doAnalyze(t)}} style={{padding:"4px 8px",borderRadius:4,border:`1px solid ${C.b}`,background:C.sf,color:C.ts,fontFamily:M,fontSize:10,cursor:"pointer"}}
                              onMouseEnter={e=>e.currentTarget.style.borderColor=C.mint+"55"}
                              onMouseLeave={e=>e.currentTarget.style.borderColor=C.b}>
                              {t}
                            </button>
                          ))}
                        </div>
                      ):<div style={{fontFamily:M,fontSize:10,color:C.tm}}>No related tickers</div>}
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"10px 14px",maxHeight:200,overflow:"auto"}}>
                      <div style={{fontFamily:M,fontSize:9,color:C.tm,letterSpacing:1,marginBottom:8}}>LATEST NEWS</div>
                      {aNews&&aNews.news&&aNews.news.length>0?(
                        aNews.news.slice(0,5).map((n,i)=>(
                          <div key={i} style={{padding:"4px 0",borderBottom:i<4?`1px solid ${C.bL}`:"none"}}>
                            <div style={{fontFamily:S,fontSize:10,color:C.ts,lineHeight:1.4,marginBottom:2}}>{n.title}</div>
                            <div style={{display:"flex",justifyContent:"space-between"}}>
                              <span style={{fontFamily:M,fontSize:8,color:C.tm}}>{n.source}</span>
                              <span style={{fontFamily:M,fontSize:8,color:C.tm}}>{(n.published||"").slice(0,10)}</span>
                            </div>
                          </div>
                        ))
                      ):<div style={{fontFamily:M,fontSize:10,color:C.tm}}>No ticker news</div>}
                    </div>
                  </div>

                  {/* ══════════════════════════════════════════════════
                      NEW PANELS — FUTURE CHART + AI ANALYSIS + S&R
                  ══════════════════════════════════════════════════ */}

                  {/* NEW ①: Future Chart — full width */}
                  <FutureChart ticker={d.ticker} C={C}/>

                  {/* NEW ② + ③: AI Analysis + Support & Resistance */}
                  <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:10,marginTop:0}}>
                    <AIAnalysisPanel ticker={d.ticker} analyzeData={d} C={C}/>
                    <SupportResistancePanel data={d} levelsData={aLevels} C={C}/>
                  </div>

                </>);
              })()}
            </div>
          )}

          {/* ═══ GUIDE ═══ */}
          {page==="guide"&&(
            <div style={{animation:"fadeIn .2s"}}>
              <div style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:8,padding:"14px 18px",marginBottom:10}}>
                <div style={{fontSize:15,fontWeight:700,color:C.mint,marginBottom:8}}>What is ATLAS?</div>
                <div style={{fontSize:13,color:C.ts,lineHeight:1.8}}>
                  A two-engine trading system. <b style={{color:C.txt}}>Setup Quality</b> (10 rules, 4 tiers) checks if conditions are right.
                  <b style={{color:C.txt}}> Conviction Score</b> decides how much to bet. Both must align for a Strong Buy.
                </div>
              </div>
              <div style={{fontFamily:M,fontSize:10,color:C.tm,letterSpacing:1,marginBottom:6}}>SIGNAL REFERENCE</div>
              {[{s:"STRONG BUY",d:"Both engines aligned. Maximum conviction. Full position."},{s:"BUY",d:"Good setup, moderate conviction. Standard position."},{s:"FORMING",d:"Setup building. 55-74%. Check back in 1-2 days."},{s:"SKIP",d:"Hard rules failed. Do not trade."}].map((x,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.b}`,borderRadius:6,padding:"8px 14px",marginBottom:4,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{minWidth:120}}><Pill sig={x.s} C={C}/></div>
                  <span style={{fontSize:12,color:C.ts}}>{x.d}</span>
                </div>
              ))}
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {page==="settings"&&(
            <div style={{animation:"fadeIn .2s"}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>Theme</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {Object.values(THEMES).map(t=>(
                  <div key={t.id} onClick={()=>switchTheme(t.id)} style={{
                    background:t.card,border:themeId===t.id?`2px solid ${t.mint}`:`2px solid ${t.b}`,
                    borderRadius:10,padding:"16px",cursor:"pointer",transition:"border-color .2s",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <div style={{width:20,height:20,borderRadius:4,background:t.mint}}/>
                      <span style={{fontFamily:S,fontSize:13,fontWeight:600,color:t.txt}}>{t.name}</span>
                      {themeId===t.id&&<span style={{fontFamily:M,fontSize:9,color:t.mint,marginLeft:"auto"}}>ACTIVE</span>}
                    </div>
                    <div style={{display:"flex",gap:6,marginBottom:8}}>
                      {[t.bg,t.card,t.mint,t.grn,t.red].map((c,i)=>(
                        <div key={i} style={{width:16,height:16,borderRadius:3,background:c,border:`1px solid ${t.b}`}}/>
                      ))}
                    </div>
                    <div style={{height:40,background:t.bg,borderRadius:4,border:`1px solid ${t.b}`,display:"flex",alignItems:"center",padding:"0 10px",gap:8}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:t.mint}}/>
                      <div style={{flex:1,height:3,background:t.b,borderRadius:2}}><div style={{height:3,width:"60%",background:t.mint,borderRadius:2}}/></div>
                      <span style={{fontFamily:M,fontSize:8,color:t.ts}}>Preview</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{marginTop:20,textAlign:"center",fontFamily:M,fontSize:8,color:C.tm,letterSpacing:2}}>ATLAS v9 · POLYGON.IO · 14-RULE ENGINE · AI ANALYSIS · NOT FINANCIAL ADVICE</div>
        </div>
      </div>
    </div>
  );
}
