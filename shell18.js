
(function(){
  'use strict';
  // Recovery build: remove any previous service worker/cache control. All learning code lives in this HTML.
  try{
    if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister().catch(function(){})})}).catch(function(){})}
    if(window.caches&&caches.keys){caches.keys().then(function(keys){keys.forEach(function(k){caches.delete(k).catch(function(){})})}).catch(function(){})}
  }catch(e){}
  function directScreen(id){
    document.querySelectorAll('.screen').forEach(function(s){s.classList.toggle('active',s.id===id)});
    document.querySelectorAll('.nav [data-screen]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-screen')===id)});
    try{window.scrollTo(0,0)}catch(e){}
  }
  window.__RN_DIRECT_SCREEN=directScreen;
  try{var badge=document.getElementById('buildBadge');if(badge)badge.textContent='Build 18 · shell ready'}catch(e){}
  try{if('serviceWorker' in navigator){navigator.serviceWorker.register('./service-worker.js?b=18',{updateViaCache:'none'}).catch(function(){})}}catch(e){}
  document.addEventListener('click',function(e){
    var tab=e.target&&e.target.closest?e.target.closest('.nav [data-screen]'):null;
    if(tab){
      if(e.preventDefault)e.preventDefault();
      var id=tab.getAttribute('data-screen');
      if(window.RN_APP&&typeof window.RN_APP.go==='function'){window.RN_APP.go(id)}else{directScreen(id)}
    }
  },true);
})();
