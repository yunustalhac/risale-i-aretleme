<script setup>
import {ref, onMounted} from 'vue'


const route = useRoute()
const router = useRouter()

const eserler = [
  "lemalar", "sozler", "sualar", "mektubat", "siracun-nur", "zulfikar",
  "asa-yi-musa", "tilsimlar", "isaratul-i-caz", "mesnevi-i-nuriye",
  "sikke-i-tasdik-i-gaybi", "barla-lahikasi", "kastamonu-lahikasi",
  "emirdag-lahikasi-1", "emirdag-lahikasi-2", "emirdag-lahikasi-3",
  "emirdag-lahikasi-4", "bes-risale", "hanimlar-rehberi", "genclik-rehberi"
]

const sideBar = ref(false)

const defaultSayfa = `https://oku.risale.online/images/risale/mektubat/001.png`

const eser = ref(route.query.eser)
const sayfaSayi = ref(route.query.sayfa)
const sayfaAc = ref(0)

const renkler = ["red", "yellow", "blue", "green", "lime", "orange", "gray", "cyan", "pink",  "maroon", "magenta", "teal", "brown", "silver", "gold"]
const secilenRenk = ref("")
const cizgiGenisligi = ref(25)

const lines = ref([])
const isDraw = ref(true)
const isDrawing = ref(false)
let x1 = null
let y1 = null

// LocalStorage anahtarı oluşturma (eser ve sayfa bazlı)
const localStorageKey = () => `${eser.value}-${sayfaSayi.value}-lines`

const git = async () => {
  const loadingIndicator = useLoadingIndicator();
  loadingIndicator.start(); // Yükleme çubuğunu başlat

  await router.push({query: {eser: eser.value, sayfa: sayfaSayi.value}});

  // Sayfa resim URL'sini ayarlama
  if (sayfaSayi.value.length < 2) {
    sayfaAc.value = `https://oku.risale.online/images/risale/${route.query.eser}/00${route.query.sayfa}.png`
  } else if (sayfaSayi.value.length < 3) {
    sayfaAc.value = `https://oku.risale.online/images/risale/${route.query.eser}/0${route.query.sayfa}.png`
  } else {
    sayfaAc.value = `https://oku.risale.online/images/risale/${route.query.eser}/${route.query.sayfa}.png`
  }

  const storedLines = localStorage.getItem(localStorageKey())
  lines.value = storedLines ? JSON.parse(storedLines) : [];

  // Yükleme çubuğunu durdur
  setTimeout(() => {
    loadingIndicator.finish();
  }, 1500); // 300ms sonra yükleme çubuğunu durdur
}

const startDrawing = (event) => {
  if (!isDraw.value) return;
  event.preventDefault();
  const touch = event.touches ? event.touches[0] : event;
  x1 = touch.pageX;
  y1 = touch.pageY;
  isDrawing.value = true;
}

const draw = (event) => {
  if (!isDrawing.value) return;
  const lineId = Date.now(); // Benzersiz bir kimlik
  event.preventDefault();
  const touch = event.touches ? event.touches[0] : event;
  const x2 = touch.pageX;
  const y2 = touch.pageY;

  lines.value.push({
    id: lineId, // Her çizgiye benzersiz bir id ver
    x1: x1,
    y1: y1,
    x2: x2,
    y2: y2,
    color: secilenRenk.value || "gold",
    cizgiGenisligi: cizgiGenisligi.value || "25px",
    eserim: route.query.eser,
    sayfam: route.query.sayfa,
  });


  // Çizimleri localStorage'a kaydet
  localStorage.setItem(localStorageKey(), JSON.stringify(lines.value));

  x1 = x2;
  y1 = y2;
}

const stopDrawing = () => {
  isDrawing.value = false;
}

const temizle = () => {
  lines.value = [];
  localStorage.removeItem(localStorageKey());
}

watch(sayfaSayi, (newVal) => {
  if (newVal) {
    git(); // Sayfa numarası değiştiğinde sayfayı getir
  }
});

onMounted(() => {
  git()
});

const sil = (lineId) => {
  console.log("Silinmeye çalışılan ID:", lineId);
  lines.value = lines.value.filter(line => line.id !== lineId);
  localStorage.setItem(localStorageKey(), JSON.stringify(lines.value)); // Güncellenmiş çizgileri localStorage'a kaydet
};


const move = (event) => {
  const cursor = document.getElementById("circularcursor");
  const cursorSize = cursor.offsetWidth / 2;  // Çemberin yarıçapı
  cursor.style.left = event.clientX - cursorSize + "px";
  cursor.style.top = event.clientY - cursorSize + "px";
};

</script>

<template>
  <div class="hidden lg:block" :style="{height:[cizgiGenisligi+'px']||'25px',width:[cizgiGenisligi+'px']||'25px'}" id="circularcursor"></div>

  <NuxtLoadingIndicator height="8"/>
  <div  @mousemove="move" class="flex flex-col">

    <div @touchstart="startDrawing" @touchend="stopDrawing" @touchmove="draw"
         @mousedown="startDrawing" @mouseup="stopDrawing" @mousemove="draw" class="relative">
      <div class="">
        <div>


          <div class="h-full w-full relative">
            <div class="w-full h-full absolute">
              <svg class="w-full h-full">
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
                 :src="sayfaAc||defaultSayfa">
          </div>
        </div>
      </div>
    </div>
    <div class="fixed top-0 w-full sideAnimation overflow-scroll h-fit">
      <div v-if="sideBar" class="p-4 bg-white shadow-lg rounded-lg transition-all sideAnimation mx-auto ">
        <div class="flex flex-col lg:flex-row lg:justify-between items-center gap-x-10 gap-y-5">
          <div class="w-full flex gap-5">
            <div class="flex flex-col w-full">
              <label class="font-semibold">Eser Seçiniz</label>
              <select @mouseout="router.push({query: {eser: eser, sayfa: sayfaSayi}})&&git()" v-model="eser"
                      class="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option disabled value="">Eser seçiniz</option>
                <option v-for="eser in eserler" :key="eser" :value="eser">{{ eser }}</option>
              </select>
            </div>

            <div class="flex flex-col w-full">
              <label class="font-semibold">Sayfa Seçiniz</label>
              <input class="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" type="text"
                     placeholder="sayfa" v-model="sayfaSayi">
            </div>
          </div>


          <div class="flex flex-col w-full">
            <span class="font-semibold">Renk Seçiniz</span>
            <div class="flex gap-2 ">
              <select v-model="secilenRenk" class="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
                <option disabled value="">Renkler</option>
                <option v-for="renk in renkler" :key="renk" :value="renk" class="text-black p-2" :style="{ background: renk }">{{ renk }}</option>
              </select>
              <span :style="{background: secilenRenk||'gold' ,height:[cizgiGenisligi+'px']}" class="rounded-full border w-5"></span>
            </div>
          </div>

          <div class="flex flex-col gap-2 w-full">
            <span class="font-semibold">Çizgi Kalınlığı</span>
            <input type="range" min="5" max="50" v-model="cizgiGenisligi" class="slider">
            <span>{{ cizgiGenisligi }}</span>
          </div>

          <div class="flex w-full gap-1">
            <div class="w-full">
              <button class="border rounded-lg p-2 bg-blue-600 text-white hover:bg-blue-700 transition duration-300"
                      @click="git()">Sayfaya Git
              </button>
            </div>

            <div class="w-full">
              <button @click="temizle"
                      class="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition duration-300">Çizimleri
                Temizle
              </button>
            </div>

            <div class="w-full">
              <button
                  class=" bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition duration-300"
                  @touchstart.prevent="isDraw = !isDraw" @mousedown.prevent="isDraw = !isDraw">
                <span v-if="isDraw">Çizimi Kapat</span>
                <span v-else>Çizimi Aç</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-center">
        <button @click="sideBar = !sideBar" class="lg:p-3 bg-white shadow-black shadow-sm rounded-lg ">kontrol paneli
        </button>
      </div>
    </div>
  </div>
</template>

<style>

* {
  cursor: none;
}

button{
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

*{
  user-select: none;
}
.sideAnimation {
  animation: animate 0.5s ease-in-out;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 5px;
  background: #ddd;
  outline: none;
}

.slider::-webkit-slider-thumb {
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4f46e5; /* Modern bir mavi tonu */
}

line:hover {
  stroke-opacity: 0.5; /* Üzerine gelindiğinde opasiteyi değiştir */
  cursor: pointer; /* Tıklanabilir göstermek için */
}


</style>