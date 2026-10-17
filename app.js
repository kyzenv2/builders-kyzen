// AMFinder Frontend Client Application (Portofolio Theme + Animations)

let currentTab = 'find';

function switchTab(tab) {
  currentTab = tab;
  const tabFind = document.getElementById('tabFind');
  const tabSearch = document.getElementById('tabSearch');
  const formFind = document.getElementById('formFindPanel');
  const formSearch = document.getElementById('formSearchPanel');
  const resFind = document.getElementById('resultFindContainer');
  const resSearch = document.getElementById('resultSearchContainer');
  const stepByStep = document.getElementById('stepByStep');

  // Tampilkan lagi step by step saat ganti tab (kalo belum nyari)
  if(stepByStep) stepByStep.classList.remove('hidden');

  if (tab === 'find') {
    tabFind.classList.add('active', 'text-black');
    tabFind.classList.remove('text-gray-400', 'hover:text-white');
    tabSearch.classList.remove('active', 'text-black');
    tabSearch.classList.add('text-gray-400', 'hover:text-white');

    formFind.classList.remove('hidden');
    formSearch.classList.add('hidden');
    resFind.classList.remove('hidden');
    resSearch.classList.add('hidden');
  } else {
    tabSearch.classList.add('active', 'text-black');
    tabSearch.classList.remove('text-gray-400', 'hover:text-white');
    tabFind.classList.remove('active', 'text-black');
    tabFind.classList.add('text-gray-400', 'hover:text-white');

    formSearch.classList.remove('hidden');
    formFind.classList.add('hidden');
    resSearch.classList.remove('hidden');
    resFind.classList.add('hidden');
  }
}

async function pasteUrl() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      document.getElementById('inputUrl').value = text.trim();
      showToast("Link berhasil ditempel!");
    }
  } catch (err) {
    showToast("Izinkan akses clipboard browser Anda", true);
  }
}

function clearQuery() {
  document.getElementById('inputQuery').value = '';
}

function quickSearch(q) {
  switchTab('search');
  document.getElementById('inputQuery').value = q;
  handleSearchPreset();
}

function showLoading(show, message = "Memproses...") {
  const loader = document.getElementById('loadingState');
  const text = document.getElementById('loadingText');
  if (show) {
    text.textContent = message;
    loader.classList.remove('hidden');
    loader.classList.add('flex');
  } else {
    loader.classList.add('hidden');
    loader.classList.remove('flex');
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');

  toastMsg.textContent = message;
  if (isError) {
    toastIcon.className = "fa-solid fa-circle-exclamation text-red-400";
  } else {
    toastIcon.className = "fa-solid fa-circle-check text-green-400";
  }

  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}

function copyToClipboard(text, label = "Link") {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} berhasil disalin!`);
  }).catch(() => {
    showToast("Gagal menyalin ke clipboard", true);
  });
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ==========================================
// 1. EKSTRAK PRESET BY URL
// ==========================================
async function handleFindPreset(targetURL = null) {
  const inputEl = document.getElementById('inputUrl');
  const url = targetURL || inputEl.value.trim();

  if (!url) {
    showToast("Harap masukkan link video TikTok terlebih dahulu!", true);
    inputEl.focus();
    return;
  }

  if (targetURL) {
    inputEl.value = targetURL;
    switchTab('find');
  }

  const resultContainer = document.getElementById('resultFindContainer');
  const stepByStep = document.getElementById('stepByStep'); // Ambil elemen panduan
  
  resultContainer.innerHTML = '';
  resultContainer.classList.add('hidden');
  
  // Sembunyikan panduan pas mulai mencari
  if(stepByStep) stepByStep.classList.add('hidden'); 

  showLoading(true, "Menganalisis video & mencari preset...");

  try {
    const res = await fetch(`/api/preset?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    showLoading(false);

    if (!data.success || !data.data) {
      showToast(data.error?.message || "Gagal mengambil data preset", true);
      renderError(resultContainer, data.error?.message || "Preset tidak ditemukan pada video ini.");
      return;
    }

    renderFindResult(resultContainer, data.data);
  } catch (err) {
    showLoading(false);
    showToast("Koneksi gagal ke API server", true);
    renderError(resultContainer, "Gagal terhubung ke API backend server: " + err.message);
  }
}

function renderError(container, message) {
  const isUpstreamDown = message.includes('530') || message.includes('offline') || message.includes('Cloudflare') || message.includes('502');

  container.innerHTML = `
    <div class="bg-[#121212] border border-red-500/30 rounded-3xl p-6 md:p-8 text-center max-w-xl mx-auto shadow-xl animate-fade-in-up">
      <div class="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
        <i class="fa-solid fa-server text-2xl"></i>
      </div>
      <h3 class="text-lg font-bold text-white">${isUpstreamDown ? 'Server Sedang Offline' : 'Proses Gagal'}</h3>
      <p class="text-gray-400 text-xs md:text-sm mt-2 leading-relaxed">${message}</p>
      
      ${isUpstreamDown ? `
        <div class="mt-4 p-3.5 bg-black/50 border border-white/5 rounded-2xl text-left text-xs text-gray-500 space-y-1">
          <p class="font-semibold text-gray-300"><i class="fa-solid fa-circle-info mr-1.5"></i>Catatan:</p>
          <p>Website berfungsi normal. Status error berasal dari server penyedia data (<code>amfinder.web.id</code>). Pemilik server mungkin sedang melakukan update.</p>
        </div>
      ` : ''}

      <div class="mt-5 flex items-center justify-center gap-3">
        <button onclick="handleFindPreset()" class="px-5 py-2.5 bg-white text-black text-xs font-bold rounded-xl transition shadow hover:bg-gray-200 flex items-center gap-2">
          <i class="fa-solid fa-rotate-right"></i>
          <span>Coba Lagi</span>
        </button>
      </div>
    </div>
  `;
  container.classList.remove('hidden');
}

function renderFindResult(container, data) {
  const video = data.video_details || {};
  const author = data.author_details || {};
  const presets = data.preset_links || [];
  const otherLinks = data.other_links || [];

  let presetCardsHTML = '';
  if (presets.length > 0) {
    presetCardsHTML = presets.map((p, idx) => {
      const isXml = (p.type || '').toLowerCase().includes('xml') || p.url.includes('drive.google.com');
      const badgeColor = isXml ? 'bg-white/10 text-gray-300 border-white/20' : 'bg-green-500/10 text-green-400 border-green-500/20';
      const badgeText = p.type ? p.type.toUpperCase() : (isXml ? 'XML' : '5MB');
      const delayClass = `delay-${Math.min((idx + 1) * 100, 800)}`;

      return `
        <div class="preset-card bg-[#121212] border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up ${delayClass}">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white flex-shrink-0">
              <i class="${isXml ? 'fa-regular fa-file-code' : 'fa-solid fa-wand-magic'}"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="text-[10px] px-2 py-0.5 rounded-md font-bold border ${badgeColor}">${badgeText}</span>
                ${p.size ? `<span class="text-[10px] text-gray-400">${p.size}</span>` : ''}
              </div>
              <h4 class="font-bold text-sm text-white">${p.title || 'Preset Alight Motion #' + (idx + 1)}</h4>
              <p class="text-[10px] text-gray-500 truncate max-w-xs md:max-w-md mt-0.5">Sumber: <span class="text-gray-400">${p.source || 'comment'} ${p.detail ? '(' + p.detail + ')' : ''}</span></p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="copyToClipboard('${p.url}', 'Link Preset')" class="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold rounded-xl transition flex items-center gap-1.5">
              <i class="fa-regular fa-copy"></i>
              <span>Salin</span>
            </button>
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="px-4 py-2.5 bg-white hover:bg-gray-200 text-black text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              <span>Buka</span>
            </a>
          </div>
        </div>
      `;
    }).join('');
  } else {
    presetCardsHTML = `
      <div class="p-6 bg-[#121212] border border-white/10 rounded-2xl text-center text-gray-500 text-xs md:text-sm animate-fade-in-up delay-200">
        Tidak ditemukan link preset di video/komentar ini.
      </div>
    `;
  }

  let otherLinksHTML = '';
  if (otherLinks.length > 0) {
    otherLinksHTML = `
      <div class="bg-[#121212] border border-white/10 rounded-2xl p-4 mt-4 animate-fade-in-up delay-500">
        <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Link Lainnya dari Kreator</h4>
        <div class="flex flex-wrap gap-2">
          ${otherLinks.map(ol => `
            <a href="${ol.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-300 hover:text-white transition">
              <i class="fa-solid fa-link text-gray-500 text-[10px]"></i>
              <span class="max-w-[180px] truncate">${ol.url}</span>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="bg-[#121212] border border-white/10 rounded-3xl p-5 md:p-6 shadow-xl animate-fade-in-up">
      <div class="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row pb-5 border-b border-white/10">
        <div class="flex items-center gap-3">
          <img src="${author.avatar || video.cover || 'https://files.catbox.moe/lktk7s.png'}" alt="${author.nickname || author.unique_id}" class="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 grayscale">
          <div>
            <h3 class="font-bold text-base md:text-lg text-white">${author.nickname || author.unique_id || data.author}</h3>
            <p class="text-xs text-gray-400 font-medium">${data.author || '@' + author.unique_id}</p>
            ${author.bio ? `<p class="text-[10px] text-gray-500 mt-1 line-clamp-2 max-w-md">${author.bio}</p>` : ''}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 animate-fade-in-up delay-100">
        <div class="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] md:aspect-auto md:h-64 border border-white/10 flex items-center justify-center group">
          <img src="${video.cover || ''}" alt="Cover" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition">
        </div>

        <div class="md:col-span-2 flex flex-col justify-between">
          <div>
            <p class="text-xs md:text-sm text-gray-300 leading-relaxed mb-4 line-clamp-3">${video.description || 'Tidak ada deskripsi video'}</p>
            <div class="grid grid-cols-3 gap-2 py-3 border-y border-white/10 text-center mb-4">
              <div>
                <span class="block text-sm font-bold text-white">${formatNumber(video.views)}</span>
                <span class="text-[9px] text-gray-500 uppercase tracking-wider">Views</span>
              </div>
              <div>
                <span class="block text-sm font-bold text-white">${formatNumber(video.likes)}</span>
                <span class="text-[9px] text-gray-500 uppercase tracking-wider">Likes</span>
              </div>
              <div>
                <span class="block text-sm font-bold text-white">${formatNumber(video.comments)}</span>
                <span class="text-[9px] text-gray-500 uppercase tracking-wider">Comments</span>
              </div>
            </div>
          </div>

          ${video.play_url_no_wm ? `
            <div class="space-y-2">
              <a href="${video.play_url_no_wm}" target="_blank" download="tiktok_nowm_${video.id}.mp4" class="w-full py-3 px-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 text-xs md:text-sm">
                <i class="fa-solid fa-download"></i>
                <span>Download Video (No WM)</span>
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <div class="space-y-3 mt-6">
      <div class="flex items-center justify-between animate-fade-in-up delay-200">
        <h3 class="font-bold text-base md:text-lg text-white flex items-center gap-2">
          <i class="fa-solid fa-wand-magic-sparkles text-gray-400"></i>
          <span>Daftar Preset</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">${presets.length}</span>
        </h3>
      </div>
      <div class="space-y-2.5">
        ${presetCardsHTML}
      </div>
    </div>

    ${otherLinksHTML}
  `;

  container.classList.remove('hidden');
}

// ==========================================
// 2. CARI VIDEO PRESET BY KEYWORD
// ==========================================
async function handleSearchPreset() {
  const query = document.getElementById('inputQuery').value.trim();
  if (!query) {
    showToast("Ketik kata kunci lagu atau preset!", true);
    document.getElementById('inputQuery').focus();
    return;
  }

  const resultContainer = document.getElementById('resultSearchContainer');
  const stepByStep = document.getElementById('stepByStep'); // Ambil elemen panduan
  
  resultContainer.innerHTML = '';
  resultContainer.classList.add('hidden');
  
  // Sembunyikan panduan pas mulai mencari
  if(stepByStep) stepByStep.classList.add('hidden'); 

  showLoading(true, `Mencari video preset untuk "${query}"...`);

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    showLoading(false);

    if (!data.success || !data.data || !data.data.items || data.data.items.length === 0) {
      showToast("Tidak ada video yang ditemukan", true);
      renderError(resultContainer, `Tidak ditemukan video preset untuk kata kunci "${query}".`);
      return;
    }

    renderSearchResult(resultContainer, data.data);
  } catch (err) {
    showLoading(false);
    showToast("Koneksi gagal ke API server", true);
    renderError(resultContainer, "Gagal terhubung ke API: " + err.message);
  }
}

function renderSearchResult(container, searchData) {
  const items = searchData.items || [];

  const cardsHTML = items.map((item, idx) => {
    const delayClass = `delay-${Math.min((idx + 1) * 100, 800)}`;
    return `
      <div class="bg-[#121212] border border-white/10 hover:border-white/20 rounded-3xl p-3 flex flex-col justify-between transition group shadow-lg animate-fade-in-up ${delayClass}">
        <div>
          <div class="relative rounded-2xl overflow-hidden aspect-[9/16] bg-black mb-3 border border-white/5">
            <img src="${item.thumbnail}" alt="${item.handle}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-80 group-hover:opacity-100">
            <span class="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white border border-white/10">
              ${item.duration ? item.duration + 's' : 'Video'}
            </span>
          </div>
          <p class="text-[11px] font-bold text-white mb-1">${item.handle}</p>
          <p class="text-[10px] text-gray-400 line-clamp-2 mb-3">${item.snippet || 'Video TikTok Preset'}</p>
        </div>

        <button onclick="handleFindPreset('${item.url}')" class="w-full py-2.5 px-3 bg-white text-black hover:bg-gray-200 active:scale-[0.98] text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
          <span>Ambil Preset</span>
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="flex items-center justify-between mb-4 animate-fade-in-up">
      <h3 class="font-bold text-sm md:text-base text-white">
        Hasil: <span class="text-gray-400 font-semibold">"${searchData.query}"</span>
      </h3>
      <span class="text-[10px] text-gray-500">${items.length} video</span>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      ${cardsHTML}
    </div>
  `;

  container.classList.remove('hidden');
}

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
  const inputUrl = document.getElementById('inputUrl');
  const inputQuery = document.getElementById('inputQuery');

  inputUrl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleFindPreset();
  });

  inputQuery.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearchPreset();
  });
});