<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const sayfaSayi = ref(0)
const sayfaAc = ref(0)
const secilenRenk = ref("")
const eserler = [
  "lemalar",
  "sozler",
  "sualar",
  "mektubat",
  "siracun-nur",
  "zulfikar",
  "asa-yi-musa",
  "tilsimlar",
  "isaratul-i-caz",
  "mesnevi-i-nuriye",
  "sikke-i-tasdik-i-gaybi",
  "barla-lahikasi",
  "kastamonu-lahikasi",
  "emirdag-lahikasi-1",
  "emirdag-lahikasi-2",
  "emirdag-lahikasi-3",
  "emirdag-lahikasi-4",
  "bes-risale",
  "hanimlar-rehberi",
  "genclik-rehberi",
]
const renkler = ["red", "yellow", "blue", "purple", "green", "lime", "orange", "gray", "cyan", "navy", "pink", "indigo", "maroon", "magenta", "teal", "brown", "silver", "gold"]
const eser = ref("lemalar")
const defaultSayfa = `https://oku.risale.online/images/risale/mektubat/001.png`

const lines = ref([]) // Çizilen çizgilerin tutulduğu array
const cizgiGenisligi = ref(25)

const isDraw = ref(true)
let x1 = null
let y1 = null
const isDrawing = ref(false) // Çizim durumu

// Sayfa değiştiğinde çizgileri sıfırla
const git = (sayfa) => {
  if (sayfaSayi.value.length < 2) {
    sayfaAc.value = `https://oku.risale.online/images/risale/${eser.value}/00${sayfa}.png`
  } else if (sayfaSayi.value.length < 3) {
    sayfaAc.value = `https://oku.risale.online/images/risale/${eser.value}/0${sayfa}.png`
  } else {
    sayfaAc.value = `https://oku.risale.online/images/risale/${eser.value}/${sayfa}.png`
  }
  // Çizgileri sıfırla
  lines.value = []
}

// Çizim başlat
const startDrawing = (event) => {
  if (!isDraw.value) return; // Çizim kapalıysa çık
  event.preventDefault(); // Varsayılan davranışı engelle
  const touch = event.touches ? event.touches[0] : event; // Mobil veya masaüstü durumu
  x1 = touch.pageX;
  y1 = touch.pageY;
  isDrawing.value = true;
}

// Çizim yap
const draw = (event) => {
  if (!isDrawing.value) return; // Çizim yapma izni yoksa çık
  event.preventDefault(); // Varsayılan davranışı engelle
  const touch = event.touches ? event.touches[0] : event; // Mobil veya masaüstü durumu
  const x2 = touch.pageX;
  const y2 = touch.pageY;

  // Yeni bir çizgi ekle
  lines.value.push({
    x1: x1,
    y1: y1,
    x2: x2,
    y2: y2,
    color: secilenRenk.value || "gold", // Rengi burada ekle
    cizgiGenisligi: cizgiGenisligi.value || "25px",
  })

  // Başlangıç noktalarını güncelle
  x1 = x2;
  y1 = y2;
}

// Çizimi durdur
const stopDrawing = () => {
  isDrawing.value = false;
}

// ESC tuşuna basıldığında çizgi işlemini iptal et
const handleKeydown = (event) => {
  if (event.key === 'Escape' && isDrawing.value) {
    stopDrawing();
  }
}

const temizle = () => {
  lines.value = []
  
}


// Component yüklendiğinde olay dinleyicilerini ekle
onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
})

// Component destroyed olduğunda olay dinleyicilerini kaldır
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
})

</script>

<template>
  <div class="flex flex-col lg:flex-row ">
    <div @touchstart="startDrawing" @touchend="stopDrawing" @touchmove="draw"
         @mousedown="startDrawing" @mouseup="stopDrawing" @mousemove="draw" class="relative">
      <div class="">
        <div class="">
          <button
              class="fixed top-0 left-0 bg-blue-950 text-white p-2 z-50 rounded-lg"
              @touchstart.prevent="isDraw = !isDraw"
              @mousedown.prevent="isDraw = !isDraw"
          >
            <span v-if="isDraw">çizimi kapat</span>
            <span v-else>çizimi aç</span>
          </button>


          <div class="h-full w-full lg:w-[85%] relative">
            <div class="w-full h-full absolute">
              <svg class="w-full h-full">
                <!-- Çizilen tüm çizgileri döngüyle render et -->
                <line v-for="(line, index) in lines" :key="index"
                      :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
                      :stroke="line.color" :stroke-width="line.cizgiGenisligi" stroke-linecap="round"
                />
              </svg>
            </div>
            <img draggable="false" class="lg:h-full relative cursor-text border-2 border-black rounded-lg object-contain" v-for="item in 1" :key="item" :src="sayfaAc || defaultSayfa">
          </div>
        </div>
      </div>
    </div>

    <div class="w-1/4 my-5">
      <div class="flex flex-col gap-3 w-fit">
        <div class="flex flex-col">
          <label>eser seçiniz</label>
          <select v-model="eser" class="border rounded-lg">
            <option disabled value="">Eser seçiniz</option>
            <option v-for="eser in eserler" :key="eser" :value="eser">{{ eser }}</option>
          </select>
        </div>
        <div class="flex flex-col">
          <label>sayfa seçiniz </label>
          <input class="border rounded-lg" type="text" placeholder="sayfa" v-model="sayfaSayi"
                 @keydown.enter="git(sayfaSayi)">
        </div>
        <button class="border rounded-lg p-2 bg-slate-300 hover:bg-slate-400 hover:text-white" @click="git(sayfaSayi)">sayfaya git</button>
        <div class="flex flex-col">
          <span>renk seçiniz</span>
          <div class="flex gap-3">
            <select v-model="secilenRenk" class="border rounded-lg">
              <option disabled value="">renkler</option>
              <option v-for="renk in renkler" :key="renk" :value="renk" class="text-black p-2"
                      :style="{ background: renk }">{{ renk }}
              </option>
            </select>
            <span :style="{ background: secilenRenk }" class="p-4 rounded-full"></span>
          </div>
        </div>
        <div class="flex flex-col">
          çizgi kalınlığı
          <input type="range" min="1" max="50" v-model="cizgiGenisligi">
          {{cizgiGenisligi}}
        </div>
        <div>
          <button @click="temizle" class="bg-red-800 text-white p-2 rounded-lg">çizimleri temizle</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* {
  user-select: none;
}
</style>
