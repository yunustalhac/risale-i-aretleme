<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from '#imports'

// ─────────────────────────────────────────────
// MEVCUT DEĞİŞKENLER VE ÇİZİM İŞLEVLERİ
// ─────────────────────────────────────────────
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
const eraserRadius = ref(20)
const lines = ref([])
const drawing = ref(false)
const lastPoint = ref(null)

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
  get() {
    return _sayfaNo.value
  },
  set(value) {
    const maxPage = maxPages[eser.value] || Infinity
    _sayfaNo.value = Math.max(1, Math.min(maxPage, value))
  }
})

const isDraw = ref(true)
const requestRef = ref()

// Diğer panel değişkenleri
const eserListesi = ref(false)
const bolumListesiBool = ref(false)
const maddeVeri = ref([])
const selectedEserIndex = ref(null)
const selectedMadde = ref(null)
const openEserIndices = ref([])

const localStorageKey = () => `${eser.value}-${sayfaNo.value}-lines`

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

function startDrawing(e) {
  if (showNoteModal.value) return; // Modal açıksa çizim devre dışı
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
  if (showNoteModal.value) return; // Modal açıksa devam etmesin
  if (isDelete.value) {
    eraseAt(e)
    return
  }
  if (!drawing.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const newPoint = { x, y }
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
  if (showNoteModal.value) return;
  if (isDelete.value) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    return
  }
  if (!drawing.value) return
  drawing.value = false
  lastPoint.value = null
  e.currentTarget.releasePointerCapture(e.pointerId)
}

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

// ─────────────────────────────────────────────
// NOT EKLEME İŞLEVSELİĞİ
// ─────────────────────────────────────────────
const noteCreationMode = ref(false)    // Not oluşturma modu aktif mi?
const noteBoxStart = ref(null)         // Not kutusu çizimine başlanılan nokta {x, y}
const noteBoxEnd = ref(null)           // Not kutusu çiziminin bitiş noktası {x, y}
const showNoteModal = ref(false)       // Not giriş modalının açık olması
const noteText = ref("")               // Modal içindeki not metni
const notePriority = ref("low")        // Önem derecesi (low, medium, high)
const notes = ref([])                  // Oluşturulan notların listesi

// Çizilen not kutusunun canlı önizlemesi
const currentNoteBox = computed(() => {
  if (!noteBoxStart.value || !noteBoxEnd.value) return null
  const x1 = noteBoxStart.value.x, y1 = noteBoxStart.value.y
  const x2 = noteBoxEnd.value.x, y2 = noteBoxEnd.value.y
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1)
  }
})

// Overlay kart için aktif notun id'si (hover ile gösterilecek)
// Ayrıca, yeni not kaydedildiğinde aktif olarak seçildiğini göstermek için de kullanılacak.
const activeNote = ref(null)

function saveNote() {
  const box = currentNoteBox.value
  if (!box) return

  // Yeni öncelik renkleri: low -> Mavi, medium -> Kırmızı, high -> Yeşil
  const priorityColors = {
    low: "#3498db",    // Mavi
    medium: "#e74c3c", // Kırmızı
    high: "#2ecc71"    // Yeşil
  }

  const newNote = {
    id: Date.now() + Math.random(),
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    text: noteText.value,
    priority: notePriority.value,
    color: priorityColors[notePriority.value]
  }

  notes.value.push(newNote)
  saveNotesToLocalStorage()
  // Yeni not eklenince onu aktif olarak vurgulayalım.
  activeNote.value = newNote.id

  // Değişkenleri sıfırla
  noteBoxStart.value = null
  noteBoxEnd.value = null
  noteCreationMode.value = false
  showNoteModal.value = false
  noteText.value = ""
  notePriority.value = "low"
}

function closeNoteModal() {
  showNoteModal.value = false
  noteBoxStart.value = null
  noteBoxEnd.value = null
  noteCreationMode.value = false
}

function activateNoteCreation() {
  noteBoxStart.value = null
  noteBoxEnd.value = null
  showNoteModal.value = false
  noteText.value = ""
  notePriority.value = "low"
  noteCreationMode.value = true
}

function loadNotes() {
  const storedNotes = localStorage.getItem(`${eser.value}-${sayfaNo.value}-notes`)
  if (storedNotes) {
    notes.value = JSON.parse(storedNotes)
  } else {
    notes.value = []
  }
}

function saveNotesToLocalStorage() {
  localStorage.setItem(`${eser.value}-${sayfaNo.value}-notes`, JSON.stringify(notes.value))
}

// ─────────────────────────────────────────────
// POINTER EVENTLERİ (ÇİZİM VE NOT KUTUSU ÇİZİMİ)
// ─────────────────────────────────────────────
function pointerDown(e) {
  if (showNoteModal.value) return; // Modal açıksa çizime müdahale etme
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  if (noteCreationMode.value) {
    // Not kutusu çizimine başla
    noteBoxStart.value = { x, y }
    noteBoxEnd.value = { x, y }
    e.currentTarget.setPointerCapture(e.pointerId)
    return
  }
  if (isDelete.value) {
    eraseAt(e)
    e.currentTarget.setPointerCapture(e.pointerId)
    return
  }
  startDrawing(e)
}

function pointerMove(e) {
  if (showNoteModal.value) return;
  if (noteCreationMode.value && noteBoxStart.value) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    noteBoxEnd.value = { x, y }
    return
  }
  if (isDelete.value) {
    eraseAt(e)
    return
  }
  continueDrawing(e)
}

function pointerUp(e) {
  if (showNoteModal.value) return;
  if (noteCreationMode.value && noteBoxStart.value && noteBoxEnd.value) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    // Not kutusu çizimi tamamlandıktan sonra modalı aç
    showNoteModal.value = true
    noteCreationMode.value = false
    return
  }
  if (isDelete.value) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    return
  }
  endDrawing(e)
}

// ─────────────────────────────────────────────
// DELETE NOTE (SİLME) FONKSİYONU
// ─────────────────────────────────────────────
function deleteNote(noteId) {
  notes.value = notes.value.filter(n => n.id !== noteId)
  activeNote.value = null
  saveNotesToLocalStorage()
}

// ─────────────────────────────────────────────
// SAYFA VE RESİM İŞLEMLERİ
// ─────────────────────────────────────────────
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

watch(eser, (newEser) => {
  const maxPage = maxPages[newEser] || Infinity
  if (_sayfaNo.value > maxPage) _sayfaNo.value = maxPage
})

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


watch([sayfaNo, eser], () => {
  git()
  loadNotes()
})
watch(isDelete, (newVal) => {})

onMounted(() => {
  git()
  loadNotes()
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
    <!-- Sol üstte örnek mavi panel -->
    <div class="absolute left-0 top-0 h-1/2 w-[100px] bg-blue z-50"></div>
    <NuxtLoadingIndicator height="4" class="rounded-full"/>

    <!-- NOT GİRİŞ MODALI (Modal en üstte yer alır) -->
    <div v-if="showNoteModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
      <div class="bg-white p-6 rounded-2xl shadow-lg w-1/2">
        <h2 class="text-xl font-semibold mb-4">Not Ekle</h2>
        <div class="mb-4">
          <label for="note" class="block text-sm font-medium text-gray-700 mb-1">Notunuz:</label>
          <input
              type="text"
              id="note"
              v-model="noteText"
              class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notunuzu buraya yazın..."
          />
        </div>
        <div class="mb-4">
          <label for="priority" class="block text-sm font-medium text-gray-700 mb-1">Önem Derecesi:</label>
          <select
              id="priority"
              v-model="notePriority"
              class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
          </select>
        </div>
        <div class="flex justify-end space-x-2">
          <button
              @click="closeNoteModal"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            İptal
          </button>
          <button
              @click="saveNote"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>

    <!-- Yeni Not Modu Göstergesi (Ekranı hafif karartan overlay) -->
    <div v-if="noteCreationMode" class="new-note-overlay"></div>

    <!-- Çizim ve Not Alanı -->
    <div class="relative touch-none overflow-hidden"
         @pointerdown="pointerDown"
         @pointermove="pointerMove"
         @pointerup="pointerUp"
         @pointercancel="pointerUp">
      <!-- Serbest çizim için SVG -->
      <svg class="absolute w-full h-full">
        <line v-for="line in lines"
              :key="line.id"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              :stroke="line.color"
              :stroke-width="line.width"
              stroke-linecap="round"/>
      </svg>

      <!-- Not kutusu canlı önizlemesi -->
      <div v-if="noteBoxStart && noteBoxEnd && currentNoteBox"
           :style="{
             position: 'absolute',
             border: '2px dashed #000',
             left: currentNoteBox.left + 'px',
             top: currentNoteBox.top + 'px',
             width: currentNoteBox.width + 'px',
             height: currentNoteBox.height + 'px'
           }">
      </div>

      <!-- Kayıtlı not kutularının gösterimi -->
      <div v-for="note in notes" :key="note.id"
           class="note-box"
           :class="{ 'disable-hover': drawing || noteCreationMode, 'selected-note': activeNote === note.id }"
           :style="{
             left: note.left + 'px',
             top: note.top + 'px',
             width: note.width + 'px',
             height: note.height + 'px',
             border: '2px solid ' + note.color
           }">
        <!-- Modern overlay kart (hover ile) -->
        <div class="note-overlay">
          <span>{{ note.text }}</span>
          
          <button
              @pointerdown.stop
              @click.stop="deleteNote(note.id)"
              class="delete-btn"
              title="Notu Sil"
          >
            &times;
          </button>

        </div>
      </div>

      <!-- Arka plan resmi -->
      <img draggable="false"
           class="relative border-2 border-black rounded-lg object-contain"
           :src="sayfaAc"
           alt=""/>
    </div>

    <!-- Sayfa Kontrol Butonları -->
    <div class="fixed bottom-3 w-full flex justify-center gap-2">
      <button @click="sayfaNo++" class="px-6 py-2 backdrop-blur-md rounded-lg border shadow-md shadow-gray">
        Sonraki Sayfa
      </button>
      <button @click="sayfaNo--" class="px-6 py-2 backdrop-blur-md rounded-lg border shadow-md shadow-gray">
        Önceki Sayfa
      </button>
    </div>

    <!-- Sol Kontrol Paneli -->
    <div class="fixed left-0 top-0 h-screen flex z-50 ">
      <div @mousemove="controlPanel = true" class="w-[20px] h-full absolute left top-0 z-40"></div>
      <transition name="slide">
        <div v-if="controlPanel"
             @mouseleave="controlPanel = false"
             class="w-72 h-[95vh] mt-2.5 bg-white/95 backdrop-blur-sm shadow-2xl rounded-r-xl p-6 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-out">
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">Renk Paleti</h3>
            <div class="grid grid-cols-4 gap-4">
              <button v-for="renk in renkler"
                      :key="renk"
                      @click="secilenRenk = renk"
                      class="h-10 w-10 rounded-md border-2 transition transform hover:scale-110"
                      :class="secilenRenk === renk ? 'border-blue-500' : 'border-gray-300'"
                      :style="{ backgroundColor: renk }">
                <svg v-if="secilenRenk === renk"
                     class="w-5 h-5 mx-auto text-white"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-3">Çizgi Kalınlığı</h3>
            <div class="relative">
              <input type="range"
                     min="5"
                     max="50"
                     v-model="cizgiGenisligi"
                     class="w-full h-2 bg-gray-300 rounded-lg appearance-none accent-blue-600"/>
              <div class="flex justify-between text-sm text-gray-500 mt-2">
                <span>İnce</span>
                <span>Kalın</span>
              </div>
            </div>
          </div>
          <div class="mt-auto space-y-4">
            <button @click="temizle();; controlPanel=false"
                    class="w-full py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors">
              Temizle
            </button>
            <button @click="isDelete = !isDelete, controlPanel=false"
                    class="w-full py-2 px-4 rounded-md transition-colors font-semibold"
                    :class="isDelete ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'">
              {{ isDelete ? 'Silme Modu Aktif' : 'Silme Modunu Aç' }}
            </button>
            <button
                @click="activateNoteCreation(); controlPanel = false"
                class="w-full py-2 px-4 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors">
              Yeni Not Ekle
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Sağ Eser Listesi Paneli (Varsa) -->
    <div class="fixed top-0 w-full sideAnimation h-fit z-50">
      <div class="fixed top-0 right-0 h-screen z-50 flex">
        <div @mousemove="sideBar = true" class="w-[20px] h-full absolute right-0 top-0 z-40"></div>
        <transition name="slide-right">
          <div v-if="sideBar"
               @mouseleave="sideBar = false"
               class="w-72 h-[95vh] mt-2.5 bg-white shadow-2xl rounded-l-2xl border border-gray-100 flex flex-col overflow-hidden">
            <div class="p-4 pb-0">
              <h3 class="text-lg font-bold text-gray-800 mb-4">Eser Listesi</h3>
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Sayfa Numarası</label>
                <input type="number"
                       v-model="sayfaNo"
                       :max="maxPages[eser] || ''"
                       class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                       placeholder="Sayfa numarası girin..."/>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto px-4">
              <div v-for="(item, index) in data" :key="index" class="group relative mb-2">
                <button
                    @click="toggleEser(index); handleEserClick(item, index);  bolumSec(true, item)"
                    class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors duration-200">
                  <span class="text-sm font-medium text-gray-700 group-hover:text-blue-600">{{ item.baslik }}</span>
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-transform"
                       :class="{ 'rotate-180': openEserIndices.includes(index) }"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <transition name="expand">
                  <div v-if="openEserIndices.includes(index)" class="ml-4 mt-2 border-l-2 border-gray-200 pl-3">
                    <button v-for="(madde, idx) in item.madde || []" :key="idx"
                            @click="(eserListesi = false,eser = item.madde.eser , bolumListesiBool = false, eser = madde.eser, sayfaNo = madde.sayfa, selectedMadde = madde , sideBar=false)"
                            class="w-full flex items-center p-2.5 mb-1 text-sm rounded-lg transition-colors duration-200"
                            :class="selectedMadde === madde ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'">
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
/* Genel Ayarlar */
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
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
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

/* Yeni Not Modu Overlay: Yeni not ekleme modunda ekranı hafif karartır */
.new-note-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 5;
}

/* Modern Not Kutusu Tasarımı */
.note-box {
  position: absolute;
  z-index: 10;
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.note-box:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.note-box.disable-hover {
  pointer-events: none;
}
/* Seçili Not Vurgusu
.selected-note {
  border: 3px solid #f39c12 !important;
  box-shadow: 0 0 10px #f39c12;
}
            */
/* Overlay Kart Modern Tasarımı */
.note-overlay {
  position: absolute;
  top: -45px;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  background: linear-gradient(135deg, #ffffff, #f9f9f9);
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 12px;
  border-radius: 8px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  z-index: 20;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.note-box:hover .note-overlay {
  opacity: 1;
  visibility: visible;
}

/* Silme Butonu (Çarpı simgesi) */
.delete-btn {
  background: transparent;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
}

/* Transition Ayarları */
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
