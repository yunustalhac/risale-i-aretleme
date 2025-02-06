<script setup>
import {ref, onMounted, watch, onBeforeUnmount} from 'vue'
import {useRoute, useRouter} from '#imports'

// -----------------------
// Router ve Route
// -----------------------
const route = useRoute()
const router = useRouter()

// -----------------------
// Sabitler ve Listeler
// -----------------------
const eserler = [
  "lemalar", "sozler", "sualar", "mektubat", "siracun-nur", "zulfikar",
  "asa-yi-musa", "tilsimlar", "isaratul-i-caz", "mesnevi-i-nuriye",
  "sikke-i-tasdik-i-gaybi", "barla-lahikasi", "kastamonu-lahikasi",
  "emirdag-lahikasi-1", "emirdag-lahikasi-2", "emirdag-lahikasi-3", "emirdag-lahikasi-4",
  "bes-risale", "hanimlar-rehberi", "genclik-rehberi"
]

const renkler = ["red", "yellow", "blue", "green", "lime", "orange", "gray", "cyan", "pink", "maroon", "magenta", "teal", "brown", "silver", "gold"]

// -----------------------
// Reactive Değişkenler
// -----------------------
const sideBar = ref(false)
const eser = ref(route.query.eser||"mektubat")
const sayfaNo = ref(route.query.sayfa||1)
const sayfaAc = ref()

const secilenRenk = ref("")
const cizgiGenisligi = ref(25)
const lines = ref([])
const isDraw = ref(true)
const isDrawing = ref(false)
let x1 = null
let y1 = null

const eserListesi = ref(false)

let isPenActive = false
const requestRef = ref()

// -----------------------
// Yardımcı Fonksiyonlar
// -----------------------

// LocalStorage anahtarı oluşturma (eser ve sayfa bazlı)
const localStorageKey = () => `${eser.value}-${sayfaNo.value}-lines`

// Varsayılan sayfa url'si oluşturma
const defaultSayfa = async () => {
  let eserVal = route.query.eser || "mektubat";
  let sayfaVal = route.query.sayfa || 1;

  // Eğer eksikse, URL parametrelerini güncelle
  if (!route.query.eser || !route.query.sayfa) {
    await router.push({ query: { eser: eserVal, sayfa: sayfaVal } });
  }

  // Sayfa numarasını 3 basamaklı yapmak için:
  const paddedSayfa = String(sayfaVal).padStart(3, '0');
  sayfaAc.value = `https://oku.risale.online/images/risale/${eserVal}/${paddedSayfa}.png`;

  return sayfaAc.value;
}


// Resim URL'sini ayarlayan ve sayfayı güncelleyen fonksiyon
const git = async () => {
  const loadingIndicator = useLoadingIndicator();
  loadingIndicator.start(); // Yükleme çubuğunu başlat


  await router.push({query: {eser: eser.value, sayfa: sayfaNo.value}});

  // Sayfa resim URL'sini ayarlama

  const paddedSayfa = String(sayfaNo.value).padStart(3, '0');
  sayfaAc.value = `https://oku.risale.online/images/risale/${route.query.eser}/${paddedSayfa}.png`;


  const storedLines = localStorage.getItem(localStorageKey())
  lines.value = storedLines ? JSON.parse(storedLines) : [];

  // Yükleme çubuğunu durdur
  setTimeout(() => {
    loadingIndicator.finish();
  }, 1500);
}

// Çizimleri temizleyen fonksiyon
const temizle = () => {
  lines.value = [];
  localStorage.removeItem(localStorageKey());
}

// Belirtilen çizgi ID'sine göre silme işlemi
const sil = (lineId) => {
  console.log("Silinmeye çalışılan ID:", lineId);
  lines.value = lines.value.filter(line => line.id !== lineId);
  localStorage.setItem(localStorageKey(), JSON.stringify(lines.value));
}

// Özel cursor hareketlerini güncelleyen fonksiyon
const move = (event) => {
  const cursor = document.getElementById("circularcursor");
  const cursorSize = cursor.offsetWidth / 2;  // Çemberin yarıçapı
  cursor.style.left = event.clientX - cursorSize + "px";
  cursor.style.top = event.clientY - cursorSize + "px";
}
// -----------------------
// Çizim İşlemleri (Pointer Eventleri)
// -----------------------

// Çizime başlama fonksiyonu
const startDrawing = (event) => {
  if (!isDraw.value) return;

  // Sadece kalemle çizim için kontrol
  if (event.pointerType !== 'pen') return;

  event.preventDefault();
  const rect = event.target.getBoundingClientRect();
  x1 = event.clientX - rect.left;
  y1 = event.clientY - rect.top;
  isDrawing.value = true;
  isPenActive = true;
}

// Çizim esnasında çalışacak fonksiyon
const draw = (event) => {
  if (!isDrawing.value || !isPenActive) return;

  // Sadece kalem hareketlerini işle
  if (event.pointerType !== 'pen') return;

  event.preventDefault();
  const rect = event.target.getBoundingClientRect();
  const x2 = event.clientX - rect.left;
  const y2 = event.clientY - rect.top;

  lines.value.push({
    id: Date.now(),
    x1: x1,
    y1: y1,
    x2: x2,
    y2: y2,
    color: secilenRenk.value || "gold",
    cizgiGenisligi: cizgiGenisligi.value || "25px",
    eserim: route.query.eser,
    sayfam: route.query.sayfa,
  });

  // LocalStorage güncelleme
  localStorage.setItem(localStorageKey(), JSON.stringify(lines.value));

  x1 = x2;
  y1 = y2;
}

// Çizim işlemini sonlandırma fonksiyonu
const stopDrawing = () => {
  isDrawing.value = false;
  isPenActive = false;
}

// Animasyon döngüsü
const animate = () => {
  requestRef.value = requestAnimationFrame(animate);
}

// -----------------------
// Watchers ve Lifecycle Hooks
// -----------------------
watch([sayfaNo, eser], ([newSayfaNo, newEser]) => {
  // Her iki değer de değiştiğinde veya her biri değiştiğinde burası tetiklenecek
  if (newSayfaNo && newEser) {
    git(); // sayfa veya eser değiştiğinde git() fonksiyonu çalıştırılır
  }
});


onMounted(() => {
  animate();
  git();
  defaultSayfa()


});

onBeforeUnmount(() => {
  cancelAnimationFrame(requestRef.value);
});

// Pen aktifken, img etiketine overflow değişikliği
if (isPenActive) {
  const img = document.querySelector('img'); // img etiketini seç
  if (img) { // img bulunursa overflow'u değiştir
    img.style.overflow = 'hidden';
  }
}
</script>


<template>

  <div class="hidden lg:block" :style="{height:[cizgiGenisligi+'px']||'25px',width:[cizgiGenisligi+'px']||'25px'}"
       id="circularcursor"></div>
  <!--  <NuxtLoadingIndicator height="8"/>-->
  <div class="flex flex-col">
    <div class="absolute left-0 top-0 h-1/2 w-[100px] bg-blue"></div>

    <div @pointerdown="startDrawing"
         @pointerup="stopDrawing"
         @pointermove="draw"
         @pointercancel="stopDrawing"
         class="relative touch-none overflow-scroll">
      <div class="">
        <div>


          <div class="h-full w-full relative">
            <div class="w-full h-full absolute"
            >
              <svg class="w-full h-full"
              >
                <g>
                  <line v-for="line in lines" :key="line.id" @click="sil(line.id)"
                        :x1="line.x1"
                        :y1="line.y1"
                        :x2="line.x2"
                        :y2="line.y2"
                        :stroke="line.color"
                        :stroke-width="line.cizgiGenisligi"
                        stroke-linecap="round"/>
                </g>
              </svg>

            </div>
            <img draggable="false"
                 class="lg:h-full relative border-2 border-black rounded-lg object-contain"
                 :src="sayfaAc" alt="">
          </div>
        </div>
      </div>
    </div>
    <div class="fixed top-0 w-full sideAnimation overflow-scroll h-fit">
      <div class="fixed left-0 top-0 h-screen flex flex-col">
        <div @mousemove="sideBar=true" class="w-[30px] h-full absolute left-0 top-0"></div>
        <div v-if="sideBar"
             @mouseleave="sideBar=false"
             class="p-4 bg-white shadow-xl rounded-r-xl transition-all duration-300 ease-in-out w-64 flex flex-col flex-grow">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">Kontrol Paneli</h2>
            <button @click="sideBar = false" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="space-y-3 flex-grow">
            <div>
              <label class="block text-sm font-medium text-gray-700">Eser</label>
              <div class="relative">
                <button @click="eserListesi = !eserListesi"
                        class="w-full border border-gray-300 rounded-lg p-2.5 text-left">
                  {{ eser  }}
                </button>
                <div v-if="eserListesi"
                     class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-md overflow-y-auto max-h-32">
                  <button v-for="e in eserler" :key="e"
                          @click="eser=e, eserListesi = false"
                          class="w-full text-left py-2 px-3 hover:bg-gray-100">
                    {{ e }}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Sayfa</label>
              <input type="number" v-model="sayfaNo" class="w-full border border-gray-300 rounded-lg p-2.5"
                     placeholder="Sayfa No">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Renk</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="renk in renkler" :key="renk" @click="secilenRenk = renk"
                        :style="{ background: renk, height:'30px', width:'30px', borderRadius: '4px' }"
                        :class="{'border-4 border-white': secilenRenk === renk, 'border border-gray-300': secilenRenk !== renk}"></button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Çizgi Kalınlığı</label>
              <input type="range" min="5" max="50" v-model="cizgiGenisligi"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <div class="text-sm text-gray-600 text-center">{{ cizgiGenisligi }}px</div>
            </div>

            <div class="flex flex-col gap-2">
              <button @click="git()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
                <i class="fas fa-arrow-right mr-2"></i> Git
              </button>
              <button @click="temizle()"
                      class="bg-red-500 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg">
                <i class="fas fa-trash mr-2"></i> Temizle
              </button>
              <button @click="isDraw = !isDraw"
                      class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg">
                <i class="fas fa-pencil-alt mr-2"></i> {{ isDraw ? 'Çizimi Kapat' : 'Çizimi Aç' }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style>

* {
  cursor: none;
}

button {
  cursor: none;
}

#circularcursor {
  background-color: transparent;
  border: 2px solid black;
  border-radius: 50%;
  position: fixed;
  z-index: 1000; /* Kaybolmasını önlemek için yüksek bir z-index ver */
  pointer-events: none; /* Tıklamaların bu elemana gelmesini engeller */
}


@keyframes animate {
  0% {
    opacity: 0;
    transform: translateY(-100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

* {
  user-select: none;
}

.sideAnimation {
  animation: animate 0.5s ease-in-out;
}


line:hover {
  stroke-opacity: 0.5; /* Üzerine gelindiğinde opasiteyi değiştir */
  cursor: pointer; /* Tıklanabilir göstermek için */
}

/* Dokunma davranışını engelleme */
img {
  touch-action: none;
  -webkit-user-drag: none;
  user-select: none;
}

/* Kalem için optimize cursor */
#circularcursor {
  display: none; /* Tablette cursor'ı gizle */
}

/* Tablet için optimize edilmiş çizim alanı */
@media (pointer: coarse) {
  .touch-none {
    touch-action: none;
    -webkit-touch-callout: none;
  }

  line {
    pointer-events: none;
  }
}
</style>

