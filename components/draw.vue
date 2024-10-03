<script setup>

const sayfaSayi = ref(0)
const sayfaAc = ref(0)

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


const eser = ref()

const defaultSayfa =`https://oku.risale.online/images/risale/mektubat/001.png`


console.log("eser", eser.value)
const git = (sayfa) => {
  console.log(eser)
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
const click = (X,event) => {
  const startLine1X = X.pageX
  const startLine1Y = X.pageY

  if (!isClick.value) {
    // İlk tıklamada başlangıç noktası belirleniyor
    x1 = startLine1X
    y1 = startLine1Y
    isClick.value = true
  } else if (isClick) {
    // İkinci tıklamada çizgiyi kalıcı hale getir
    const x2 = startLine1X
    const y2 = startLine1Y

    lines.value.push({
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
    })
    // Geçici çizgiyi temizle
    tempLine.value = null
    isClick.value = false
  }
}

const close = () => {
  alert("bismillah")
}

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


// ESC tuşuna basıldığında çizgi işlemini iptal et
const handleKeydown = (event) => {
  if (event.key === 'Escape' && isClick.value) {
    // Çizgi çekme işlemini iptal et
    tempLine.value = null
    isClick.value = false
    console.log("Çizgi iptal edildi")
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
</script>

<template>

  <div class="">
    <div class="absolute right-3 flex flex-col">

      eser seçiniz
      <select v-model="eser" class="border rounded-lg">
        <option disabled selected>eser seçiniz</option>
        <option v-for="eser in eserler" :key="eser" :value="eser">{{ eser }}</option>
      </select>
      sayfa seçiniz
      <input class="border rounded-lg" type="text" placeholder="sayfa" v-model="sayfaSayi"
             @keydown.enter="git(sayfaSayi)">

    </div>

    <div @mousemove="mouse">
      <div class="grid">
        <div @click="click" class="">
          <div class="h-full w-[85%] relative">
            <div class="w-full h-full absolute">
              <svg class="w-full h-full bg-amber-100">
                <!-- Çizilen tüm çizgileri döngüyle render et -->
                <line v-for="(line, index) in lines" :key="index"
                      :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
                      stroke="#f49f2f" stroke-width="25" stroke-linecap="round"
                      style="filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))"/>
                <!-- Geçici çizgiyi çiz -->
                <line v-if="tempLine"
                      :x1="tempLine.x1" :y1="tempLine.y1" :x2="tempLine.x2" :y2="tempLine.y2"
                      stroke="#7B82F6" stroke-width="25" stroke-linecap="round"
                      stroke-dasharray="5, 5" style="filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))"/>
              </svg>
            </div>
            <img draggable="false" class="h-full relative" v-for="item in 1" :key="item" :src="sayfaAc||defaultSayfa">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
*{
  user-select: none;
}
</style>
