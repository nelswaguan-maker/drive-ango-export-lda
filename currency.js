/* DRIVE — conversão automática USD ↔ MT (MZN)
   Os preços são guardados no banco em USD. A conversão é apenas de apresentação.
*/
(function(){
  const KEY='driveCurrency';
  const RATE_KEY='driveUsdMznRate';
  const RATE_TIME_KEY='driveUsdMznRateTime';
  const DEFAULT_CURRENCY='MT';
  let currency=localStorage.getItem(KEY)||DEFAULT_CURRENCY;
  let rate=Number(localStorage.getItem(RATE_KEY)||0);
  let rateTime=Number(localStorage.getItem(RATE_TIME_KEY)||0);

  function setCurrency(c){
    currency=c==='USD'?'USD':'MT';
    localStorage.setItem(KEY,currency);
    window.dispatchEvent(new CustomEvent('driveCurrencyChanged',{detail:{currency,rate}}));
    updateSelectors();
  }
  function usdToMtn(usd){return Number(usd||0)*rate;}
  function formatMoney(usd){
    const n=Number(usd||0);
    if(currency==='USD') return `USD ${n.toLocaleString('en-US',{maximumFractionDigits:0})}`;
    if(rate>0) return `MT ${usdToMtn(n).toLocaleString('pt-MZ',{maximumFractionDigits:0})}`;
    return `MT —`;
  }
  function updateSelectors(){
    document.querySelectorAll('[data-drive-currency]').forEach(el=>{
      el.value=currency;
      el.textContent=currency==='MT'?'MT (Metical)':'USD (Dólar)';
    });
    document.querySelectorAll('[data-drive-rate]').forEach(el=>{
      el.textContent=rate>0?`1 USD ≈ ${rate.toLocaleString('pt-MZ',{maximumFractionDigits:2})} MT`:'A obter câmbio…';
    });
  }
  async function loadRate(){
    const fresh=rate>0 && Date.now()-rateTime<3600000;
    if(fresh){updateSelectors();return rate;}
    try{
      const r=await fetch('https://open.er-api.com/v6/latest/USD',{cache:'no-store'});
      if(!r.ok) throw new Error('Falha no câmbio');
      const data=await r.json();
      const next=Number(data?.rates?.MZN);
      if(!Number.isFinite(next)||next<=0) throw new Error('MZN indisponível');
      rate=next; rateTime=Date.now();
      localStorage.setItem(RATE_KEY,String(rate));
      localStorage.setItem(RATE_TIME_KEY,String(rateTime));
      updateSelectors();
      window.dispatchEvent(new CustomEvent('driveExchangeUpdated',{detail:{rate}}));
      return rate;
    }catch(e){
      console.warn('Câmbio USD/MT:',e);
      updateSelectors();
      return rate;
    }
  }
  window.driveCurrency={get:()=>currency,set:setCurrency,getRate:()=>rate,convert:usdToMtn,format:formatMoney,refresh:loadRate};
  window.driveFormatMoney=formatMoney;
  window.driveRefreshCurrency=loadRate;
  document.addEventListener('DOMContentLoaded',()=>{updateSelectors();loadRate();});
})();
