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
const renkler = ["#c42f1f", "red", "yellow", "blue", "purple", "green", "lime", "orange", "gray", "cyan", "navy", "pink", "indigo", "maroon", "magenta", "teal", "brown", "silver", "gold", "aqua"]

const eser = ref()
const defaultSayfa = `https://oku.risale.online/images/risale/mektubat/001.png`

const git = (sayfa) => {
  if (sayfaSayi.value.length < 2) {
    return sayfaAc.value = `https://oku.risale.online/images/risale/${eser.value}/00${sayfa}.png`
  } else if (sayfaSayi.value.length < 3) {
    return sayfaAc.value = `https://oku.risale.online/images/risale/${eser.value}/0${sayfa}.png`
  } else {
    return sayfaAc.value = `https://oku.risale.online/images/risale/${eser.value}/${sayfa}.png`
  }
}

const lines = ref([]) // Çizilen çizgilerin tutulduğu array
const isClick = ref(false)

let x1 = null
let y1 = null
const tempLine = ref(null) // Geçici çizgi için

// Tıklama işlemi
const click = (X, event) => {
  const startLine1X = X.pageX
  const startLine1Y = X.pageY

  if (!isClick.value) {
    // İlk tıklamada başlangıç noktası belirleniyor
    x1 = startLine1X
    y1 = startLine1Y
    isClick.value = true
  } else {
    // İkinci tıklamada çizgiyi kalıcı hale getir
    const x2 = startLine1X
    const y2 = startLine1Y

    lines.value.push({
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      color: secilenRenk.value || "#c42f1f", // Rengi burada ekle
    })
    // Geçici çizgiyi temizle
    tempLine.value = null
    isClick.value = false
  }
}

// ESC tuşuna basıldığında çizgi işlemini iptal et
const handleKeydown = (event) => {
  if (event.key === 'Escape' && isClick.value) {
    // Çizgi çekme işlemini iptal et
    tempLine.value = null
    isClick.value = false
  }
}

// Component yüklendiğinde keydown olayını dinlemeye başla
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

// Component destroyed olduğunda keydown olayını kaldır
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Fare hareket ettikçe geçici çizgiyi güncelle
const mouse = (X) => {
  if (isClick.value) {
    const x2 = X.pageX
    const y2 = X.pageY
    // Geçici çizgiyi güncelle
    tempLine.value = {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
    }
  }
}
</script>

<template>
  <div>
    <div class="absolute right-3 flex flex-col">
      eser seçiniz
      <select v-model="eser" class="border rounded-lg">
        <option disabled selected>eser seçiniz</option>
        <option v-for="eser in eserler" :key="eser" :value="eser">{{ eser }}</option>
      </select>
      sayfa seçiniz
      <input class="border rounded-lg" type="text" placeholder="sayfa" v-model="sayfaSayi" @keydown.enter="git(sayfaSayi)">

      <span>renk seçiniz</span>
      <div class="flex gap-3">
        <select v-model="secilenRenk" class="border rounded-lg">
          <option v-for="renk in renkler" :key="renk" :value="renk" class="text-black p-2" :style="{ background: renk }">{{ renk }}</option>
        </select>
        <span :style="{ background: secilenRenk }" class="p-4 rounded-full"></span>
      </div>
    </div>

    <div @mousemove="mouse">
      <div class="grid">
        <div @click="click" class="">
          <div class="h-full w-[85%] relative">
            <div class="w-full h-full absolute">
              <svg class="w-full h-full">
                <!-- Çizilen tüm çizgileri döngüyle render et -->
                <line v-for="(line, index) in lines" :key="index"
                      :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
                      :stroke="line.color" stroke-width="25" stroke-linecap="round"
                      style="filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))"/>
                <!-- Geçici çizgiyi çiz -->
                <line v-if="tempLine"
                      :x1="tempLine.x1" :y1="tempLine.y1" :x2="tempLine.x2" :y2="tempLine.y2"
                      stroke="#156790" stroke-width="25" stroke-linecap="round"
                      stroke-dasharray="5, 5" style="filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))"/>
              </svg>
            </div>
            <img draggable="false" class="h-full relative cursor-text border-2 border-black rounded-lg" v-for="item in 1" :key="item" :src="sayfaAc || defaultSayfa">
          </div>
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
