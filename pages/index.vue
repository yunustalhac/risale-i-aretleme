<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from '#imports'

// ===== Değişkenler =====
const route = useRoute()
const router = useRouter()
const { data, error } = await useFetch('/api/data')

const controlPanel = ref(false)
const sideBar = ref(false)
const eser = ref(route.query.eser || "mektubat")
const _sayfaNo = ref(Math.max(1, Number(route.query.sayfa) || 1))
const sayfaAc = ref("")
const secilenRenk = ref("#FFD700")
const cizgiGenisligi = ref(7)
const isDelete = ref(false)

// Yeni: Eraser yarıçapı (silgi hassasiyeti)
const eraserRadius = ref(20)

const lines = ref([])         // Çizim sırasında oluşturulan line segmentleri
const drawing = ref(false)      // Çizim modunun aktif olup olmadığını belirler
const lastPoint = ref(null)     // Serbest çizimde son nokta

const renkler = [
  "#000000", "#4A4A4A", "#FF6347", "#FFA500", "#FFD700",
  "#1E90FF", "#32CD32", "#2E8B57", "#800080", "#FFC0CB",
  "#B0C4DE", "#D3D3D3", "#8B4513", "#F5F5DC", "#FFFFFF",
  "#708090"
]

const maxPages = {
  "sozler": 379, "lemalar": 419, "sualar": 628, "mektubat": 515,
  "siracun-nur": 309, "zulfikar": 375, "asa-yi-musa": 318,
  "tilsimlar": 164, "isaratul-i-caz": 284, "mesnevi-i-nuriye": 294,
  "sikke-i-tasdik-i-gaybi": 248, "barla-lahikasi": 368, "kastamonu-lahikasi": 343,
  "emirdag-lahikasi-1": 464, "emirdag-lahikasi-2": 475, "emirdag-lahikasi-3": 460,
  "emirdag-lahikasi-4": 562, "bes-risale": 95, "hanimlar-rehberi": 162,
  "genclik-rehberi": 84
}

const sayfaNo = computed({
  get() { return _sayfaNo.value },
  set(value) {
    const maxPage = maxPages[eser.value] || Infinity
    _sayfaNo.value = Math.max(1, Math.min(maxPage, value))
  }
})

const isDraw = ref(true)
const requestRef = ref()

// Diğer sidebar vb. değişkenler
const eserListesi = ref(false)
const bolumListesiBool = ref(false)
const maddeVeri = ref([])
const selectedEserIndex = ref(null)
const selectedMadde = ref(null)
const openEserIndices = ref([])

// ===== LocalStorage İşlemleri =====
// LocalStorage anahtarını oluşturuyoruz (eser-sayfa bazlı)
const localStorageKey = () => `${eser.value}-${sayfaNo.value}-lines`

// Çizim detaylarını (eser, sayfa, renk, kalınlık, line segmentleri) kaydeder
function saveToLocalStorage() {
  const drawingData = {
    eser: eser.value,
    sayfa: sayfaNo.value,
    secilenRenk: secilenRenk.value,
    cizgiGenisligi: cizgiGenisligi.value,
    lines: lines.value
  }
  localStorage.setItem(localStorageKey(), JSON.stringify(drawingData))
}

const temizle = () => {
  lines.value = []
  localStorage.removeItem(localStorageKey())
}

// ===== Çizim ve Silgi Fonksiyonları =====

// Free-hand çizim fonksiyonları (line segmentler olarak)
function startDrawing(e) {
  // Eğer silgi modu aktifse, çizim yapmadan eraser fonksiyonunu kullan
  if (isDelete.value) {
    eraseAt(e)
    e.currentTarget.setPointerCapture(e.pointerId)
    return
  }
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  drawing.value = true
  lastPoint.value = { x, y }
  e.currentTarget.setPointerCapture(e.pointerId)
}

function continueDrawing(e) {
  if (isDelete.value) {
    eraseAt(e)
    return
  }
  if (!drawing.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const newPoint = { x, y }
  // Yeni line segment: son nokta ile yeni gelen nokta arasında
  lines.value.push({
    id: Date.now() + Math.random(),
    color: secilenRenk.value,
    width: cizgiGenisligi.value,
    x1: lastPoint.value.x,
    y1: lastPoint.value.y,
    x2: newPoint.x,
    y2: newPoint.y
  })
  lastPoint.value = newPoint
  saveToLocalStorage()
}

function endDrawing(e) {
  if (isDelete.value) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    return
  }
  if (!drawing.value) return
  drawing.value = false
  lastPoint.value = null
  e.currentTarget.releasePointerCapture(e.pointerId)
}

// Geliştirilmiş Silgi Fonksiyonu: Belirlenen eraserRadius içinde kalan tüm line segmentlerini siler
function eraseAt(e) {
  try {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    let removed = false
    lines.value = lines.value.filter(line => {
      const dStart = Math.hypot(line.x1 - x, line.y1 - y)
      const dEnd = Math.hypot(line.x2 - x, line.y2 - y)
      const d = Math.min(dStart, dEnd)
      if (d < eraserRadius.value) {
        removed = true
        return false
      }
      return true
    })
    if (removed) saveToLocalStorage()
  } catch (error) {
    console.error("Erase işlemi sırasında hata oluştu:", error)
  }
}

// Pointer event handler'ları: Silgi veya çizim moduna göre yönlendirir
function pointerDown(e) {
  if (isDelete.value) {
    eraseAt(e)
    e.currentTarget.setPointerCapture(e.pointerId)
    return
  }
  startDrawing(e)
}

function pointerMove(e) {
  if (isDelete.value) {
    eraseAt(e)
    return
  }
  continueDrawing(e)
}

function pointerUp(e) {
  if (isDelete.value) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    return
  }
  endDrawing(e)
}

// ===== Sayfa İşlemleri =====
const defaultSayfa = async () => {
  const eserVal = route.query.eser || "mektubat"
  const sayfaVal = route.query.sayfa || 1
  if (!route.query.eser || !route.query.sayfa) {
    await router.replace({ query: { eser: eserVal, sayfa: sayfaVal } })
  }
  const paddedSayfa = String(sayfaVal).padStart(3, '0')
  sayfaAc.value = `https://oku.risale.online/images/risale/${eserVal}/${paddedSayfa}.png`
  return sayfaAc.value
}

const git = async () => {
  const paddedSayfa = String(sayfaNo.value).padStart(3, '0')
  sayfaAc.value = `https://oku.risale.online/images/risale/${eser.value}/${paddedSayfa}.png`
  const storedData = localStorage.getItem(localStorageKey())
  if (storedData) {
    const parsedData = JSON.parse(storedData)
    lines.value = parsedData.lines || []
    secilenRenk.value = parsedData.secilenRenk || secilenRenk.value
    cizgiGenisligi.value = parsedData.cizgiGenisligi || cizgiGenisligi.value
  } else {
    lines.value = []
  }
  await router.replace({ query: { eser: eser.value, sayfa: sayfaNo.value } })
  const currentUrl = `https://oku.risale.online/images/risale/${eser.value}/${paddedSayfa}.png`
  sayfaAc.value = currentUrl
  const prevPage = sayfaNo.value - 1
  const nextPage = sayfaNo.value + 1
  const maxPage = maxPages[eser.value] || Infinity
  if (prevPage >= 1) {
    const paddedPrev = String(prevPage).padStart(3, '0')
    const prevUrl = `https://oku.risale.online/images/risale/${eser.value}/${paddedPrev}.png`
    const imgPrev = new Image()
    imgPrev.src = prevUrl
    console.log(`Ön yüklenen önceki sayfa: ${prevUrl}`)
  }
  if (nextPage <= maxPage) {
    const paddedNext = String(nextPage).padStart(3, '0')
    const nextUrl = `https://oku.risale.online/images/risale/${eser.value}/${paddedNext}.png`
    const imgNext = new Image()
    imgNext.src = nextUrl
    console.log(`Ön yüklenen sonraki sayfa: ${nextUrl}`)
  }
  router.replace({ query: { eser: eser.value, sayfa: sayfaNo.value } })
}

// ===== Eser Listesi ve Diğer Yardımcı Fonksiyonlar =====
function handleEserClick(item, index) {
  selectedEserIndex.value = index
  bolumSec(true, item)
}

function bolumSec(bool, item) {
  bolumListesiBool.value = bool
  maddeVeri.value = item.madde || []
}

function toggleEser(index) {
  if (openEserIndices.value.includes(index)) {
    openEserIndices.value = openEserIndices.value.filter(i => i !== index)
  } else {
    openEserIndices.value.push(index)
  }
}

/* ===== Watch and Lifecycle Hooks ===== */
watch(eser, (newEser) => {
  const maxPage = maxPages[newEser] || Infinity
  if (_sayfaNo.value > maxPage) _sayfaNo.value = maxPage
})

watch([sayfaNo], () => git())

watch(isDelete, (newVal) => {
  // İsteğe bağlı: isDelete değiştiğinde yapılacak ek işlemler
})

onMounted(() => {
  git()
  const storedData = localStorage.getItem(localStorageKey())
  if (storedData) {
    const parsedData = JSON.parse(storedData)
    lines.value = parsedData.lines || []
    secilenRenk.value = parsedData.secilenRenk || secilenRenk.value
    cizgiGenisligi.value = parsedData.cizgiGenisligi || cizgiGenisligi.value
  }
  defaultSayfa()
})

onBeforeUnmount(() => {
  if (requestRef.value) cancelAnimationFrame(requestRef.value)
})
</script>

<template>
  <div class="flex flex-col">
    <!-- Üstteki Örnek Blok -->
    <div class="absolute left-0 top-0 h-1/2 w-[100px] bg-blue"></div>
    <NuxtLoadingIndicator height="4" class="rounded-full"/>

    <!-- Çizim Alanı -->
    <div
        class="relative touch-none overflow-hidden"
        @pointerdown="pointerDown"
        @pointermove="pointerMove"
        @pointerup="pointerUp"
        @pointercancel="pointerUp"
    >
      <svg class="absolute w-full h-full">
        <!-- Çizilen line segmentleri -->
        <line
            v-for="line in lines"
            :key="line.id"
            :x1="line.x1"
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
            :stroke="line.color"
            :stroke-width="line.width"
            stroke-linecap="round"
        />
      </svg>
      <img
          draggable="false"
          class="relative border-2 border-black rounded-lg object-contain"
          :src="sayfaAc"
          alt=""
      />
    </div>

    <div class="fixed bottom-3 w-full flex justify-center gap-2">
      <button @click="sayfaNo++" class="px-6 py-2 backdrop-blur-md rounded-lg border shadow-md shadow-gray">Sonraki Sayfa</button>
      <button @click="sayfaNo--" class="px-6 py-2 backdrop-blur-md rounded-lg border shadow-md shadow-gray">Önceki Sayfa</button>
    </div>

    <!-- Kontrol Paneli -->
    <div class="fixed left-0 top-0 h-screen flex">
      <!-- Paneli açmak için dar tetikleyici alan -->
      <div @mousemove="controlPanel = true" class="w-[20px] h-full absolute left top-0 z-40"></div>
      <transition name="slide">
        <div
            v-if="controlPanel"
            @mouseleave="controlPanel = false"
            class="w-72 h-[95vh] mt-2.5 bg-white/95 backdrop-blur-sm shadow-2xl rounded-r-xl p-6 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-out"
        >
          <!-- Renk Paleti Bölümü -->
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">Renk Paleti</h3>
            <div class="grid grid-cols-4 gap-4">
              <button
                  v-for="renk in renkler"
                  :key="renk"
                  @click="secilenRenk = renk"
                  class="h-10 w-10 rounded-md border-2 transition transform hover:scale-110"
                  :class="secilenRenk === renk ? 'border-blue-500' : 'border-gray-300'"
                  :style="{ backgroundColor: renk }"
              >
                <svg
                    v-if="secilenRenk === renk"
                    class="w-5 h-5 mx-auto text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Çizgi Kalınlığı Bölümü -->
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-3">Çizgi Kalınlığı</h3>
            <div class="relative">
              <input
                  type="range"
                  min="5"
                  max="50"
                  v-model="cizgiGenisligi"
                  class="w-full h-2 bg-gray-300 rounded-lg appearance-none accent-blue-600"
              />
              <div class="flex justify-between text-sm text-gray-500 mt-2">
                <span>İnce</span>
                <span>Kalın</span>
              </div>
            </div>
          </div>

          <!-- Aksiyon Butonları -->
          <div class="mt-auto space-y-4">
            <button
                @click="temizle()"
                class="w-full py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
            >
              Temizle
            </button>
            <button
                @click="isDelete = !isDelete"
                class="w-full py-2 px-4 rounded-md transition-colors font-semibold"
                :class="isDelete ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'"
            >
              {{ isDelete ? 'Silme Modu Aktif' : 'Silme Modunu Aç' }}
            </button>
            <button
                class="w-full py-2 px-4 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
            >
              Yeni Not Ekle
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Sağ Sidebar -->
    <div class="fixed top-0 w-full sideAnimation h-fit">
      <div class="fixed top-0 right-0 h-screen z-50 flex">
        <div @mousemove="sideBar = true" class="w-[20px] h-full absolute right-0 top-0 z-40"></div>
        <transition name="slide-right">
          <div
              v-if="sideBar"
              @mouseleave="sideBar = false"
              class="w-72 h-[95vh] mt-2.5 bg-white shadow-2xl rounded-l-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            <div class="p-4 pb-0">
              <h3 class="text-lg font-bold text-gray-800 mb-4">Eser Listesi</h3>
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Sayfa Numarası</label>
                <input
                    type="number"
                    v-model="sayfaNo"
                    :max="maxPages[eser] || ''"
                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Sayfa numarası girin..."
                />
              </div>
            </div>
            <div class="flex-1 overflow-y-auto px-4">
              <div v-for="(item, index) in data" :key="index" class="group relative mb-2">
                <button
                    @click="toggleEser(index); handleEserClick(item, index); eser = item.madde.eser; bolumSec(true, item)"
                    class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors duration-200"
                >
                  <span class="text-sm font-medium text-gray-700 group-hover:text-blue-600">{{ item.baslik }}</span>
                  <svg
                      class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-transform"
                      :class="{ 'rotate-180': openEserIndices.includes(index) }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <transition name="expand">
                  <div v-if="openEserIndices.includes(index)" class="ml-4 mt-2 border-l-2 border-gray-200 pl-3">
                    <button
                        v-for="(madde, idx) in item.madde || []"
                        :key="idx"
                        @click="(eserListesi = false, bolumListesiBool = false, eser = madde.eser, sayfaNo = madde.sayfa, selectedMadde = madde)"
                        class="w-full flex items-center p-2.5 mb-1 text-sm rounded-lg transition-colors duration-200"
                        :class="selectedMadde === madde ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'"
                    >
                      <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {{ madde.bolum }}
                    </button>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style>
img {
  touch-action: none;
  -webkit-user-drag: none;
}

@media (pointer: coarse) {
  .touch-none {
    touch-action: none;
    -webkit-touch-callout: none;
  }
}

.sideAnimation {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

line {
  pointer-events: visibleStroke;
}

@media (pointer: coarse) {
  .touch-none {
    touch-action: pan-x pan-y;
    -webkit-touch-callout: default;
  }
}

/* Animasyonlar */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from, .slide-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-active, .slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from, .slide-right-leave-to {
  transform: translateX(100%);
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
}

.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
