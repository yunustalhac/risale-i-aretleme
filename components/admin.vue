<script setup>
const route = useRoute()
const router = useRouter()

</script>

<template>
  <div class="fixed top-0 w-full sideAnimation overflow-scroll h-fit">
    <div v-if="sideBar" class="p-6 bg-white shadow-xl rounded-xl transition-all sideAnimation mx-auto max-w-6xl m-4">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Eser ve Sayfa Seçimi -->
        <div class="space-y-4 col-span-2">
          <div class="flex gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Eser</label>
              <select @mouseout="router.push({query: {eser: eser, sayfa: sayfaSayi}})&&git()" v-model="eser"
                      class="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                <option disabled value="">Eser seçiniz</option>
                <option v-for="eser in eserler" :key="eser" :value="eser">{{ eser }}</option>
              </select>
            </div>

            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Sayfa</label>
              <input class="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                     type="text" placeholder="Sayfa numarası giriniz" v-model="sayfaSayi">
            </div>
          </div>
        </div>

        <!-- Renk Seçimi -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Renk</label>
          <div class="flex items-center gap-2">
            <select v-model="secilenRenk"
                    class="flex-1 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <option disabled value="">Renk seçiniz</option>
              <option v-for="renk in renkler" :key="renk" :value="renk"
                      class="p-2" :style="{ background: renk }">{{ renk }}</option>
            </select>
            <div :style="{background: secilenRenk||'gold', height:'30px', width:'30px'}"
                 class="rounded-full border shadow-sm"></div>
          </div>
        </div>

        <!-- Çizgi Kalınlığı -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Çizgi Kalınlığı</label>
          <div class="space-y-2">
            <input type="range" min="5" max="50" v-model="cizgiGenisligi"
                   class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
            <div class="text-sm text-gray-600 text-center">{{ cizgiGenisligi }}px</div>
          </div>
        </div>

        <!-- Butonlar -->
        <div class="col-span-full flex gap-4 mt-4">
          <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                  @click="git()">
              <span class="flex items-center justify-center gap-2">
                <i class="fas fa-arrow-right"></i>
                Sayfaya Git
              </span>
          </button>

          <button @click="temizle"
                  class="flex-1 bg-red-500 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
              <span class="flex items-center justify-center gap-2">
                <i class="fas fa-trash"></i>
                Çizimleri Temizle
              </span>
          </button>

          <button class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                  @touchstart.prevent="isDraw = !isDraw" @mousedown.prevent="isDraw = !isDraw">
              <span class="flex items-center justify-center gap-2">
                <i class="fas fa-pencil-alt"></i>
                {{ isDraw ? 'Çizimi Kapat' : 'Çizimi Aç' }}
              </span>
          </button>
        </div>
      </div>
    </div>
    <div class="flex justify-center mt-2">
      <button @click="sideBar = !sideBar"
              class="bg-white hover:bg-gray-50 text-gray-800 font-medium py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
        {{ sideBar ? 'Kontrol Panelini Gizle' : 'Kontrol Panelini Göster' }}
      </button>
    </div>
  </div>

</template>