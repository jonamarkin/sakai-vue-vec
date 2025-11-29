<script setup>
import AppConfig from '@/layout/AppConfig.vue';
import { ref, computed, onMounted } from 'vue'
import { SpinTheWheel } from 'vue-spin-the-wheel'
import 'vue-spin-the-wheel/style.css'
import { doc, setDoc, serverTimestamp, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db } from '../../firebase/init.js';


const prizeId = ref(0)
const winnerdialog = ref(false)
const showConfetti = ref(false)

let audienceNumbersArray = ref(Array.from({ length: 20 }, (_, i) => i + 1));

let winner = ref({
    num: '01',
    name: 'VocalEssence Chorale',
})

// Confetti animation
const confettiPieces = ref([])

function startConfetti() {
    showConfetti.value = true
    confettiPieces.value = []
    
    for (let i = 0; i < 150; i++) {
        confettiPieces.value.push({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 3,
            duration: 3 + Math.random() * 2,
            color: ['#e74c3c', '#27ae60', '#f39c12', '#3498db', '#9b59b6'][Math.floor(Math.random() * 5)]
        })
    }
    
    setTimeout(() => {
        showConfetti.value = false
    }, 6000)
}

function removeNumberFromArray(num) {
    const index = audienceNumbersArray.value.indexOf(num);
    if (index > -1) {
        audienceNumbersArray.value.splice(index, 1);
    }
}

const wheelEl = ref()
const canvasVerify = ref(false)
const verifyDuration = 2
const canvasOptions = {
    btnWidth: 180,
    borderColor: '#d4af37',
    borderWidth: 8,
    lineHeight: 35
}

let prizesCanvas = ref([
    {
        id: 1,
        name: 'Blue',
        value: 'Blue\'s value',
        bgColor: '#45ace9',
        color: '#ffffff',
        probability: 20
    },
    {
        id: 2,
        name: 'Red',
        value: 'Red\'s value',
        bgColor: '#dd3832',
        color: '#ffffff',
        probability: 20
    },
    {
        id: 3,
        name: 'Yellow',
        value: 'Yellow\'s value',
        bgColor: '#fef151',
        color: '#ffffff',
        probability: 20
    },
    {
        id: 4,
        name: 'Green',
        value: 'Green\'s value',
        bgColor: '#7ac143',
        color: '#ffffff',
        probability: 20
    },
    {
        id: 5,
        name: 'Purple',
        value: 'Purple\'s value',
        bgColor: '#a349a4',
        color: '#ffffff',
        probability: 20
    }
]);

const prizeRes = computed(() => {
    return prizesCanvas.find(item => item.id === prizeId.value) || prizesCanvas[0]
})

onMounted(async () => {
    //await fetchAudienceNumber();
    generatePrizesCanvas();
})

function testRequest(verified, duration) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(verified)
        }, duration)
    })
}

function onCanvasRotateStart(rotate) {
    if (canvasVerify.value) {
        const verified = true
        testRequest(verified, verifyDuration * 1000).then((verifiedRes) => {
            if (verifiedRes) {
                console.log('Verification passed, start to rotate')
                rotate()
                canvasVerify.value = false
            } else {
                alert('Failed verification')
            }
        })
        return
    }
    console.log('onCanvasRotateStart')
}

function onImageRotateStart() {
    console.log('onImageRotateStart')
}

function onRotateEnd(prize) {
    winnerdialog.value = true
    startConfetti()
    console.log('onRotateEnd', prize)
    winner.value.name = prize.value
    winner.value.num = prize.value

    removeNumberFromArray(prize.value);
    console.log("Remaining numbers:", audienceNumbersArray.value);
    
    setTimeout(() => {
        generatePrizesCanvas();
    }, 100)
}

function onChangePrize(id) {
    prizeId.value = id
}

let collectionName = 'uat_audiences';

const fetchAudienceNumber = async () => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    querySnapshot.forEach((doc) => {
        audienceNumbersArray.value.push(doc.data().regNumber);
    });
};

function generatePrizesCanvas(numPrizes = 8) {
    if (audienceNumbersArray.value.length < numPrizes) {
        const additionalNumbers = Array.from({ length: numPrizes - audienceNumbersArray.value.length }, (_, i) => 0);
        audienceNumbersArray.value.push(...additionalNumbers);
    }

    const shuffled = [...audienceNumbersArray.value].sort(() => Math.random() - 0.5);
    const selectedNumbers = shuffled.slice(0, numPrizes);

    const bgColors = ['#e74c3c', '#27ae60', '#f39c12', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#c0392b'];
    const textColor = '#ffffff';

    const probability = +(100 / numPrizes).toFixed(4);

    prizesCanvas.value = selectedNumbers.map((num, index) => ({
        id: num,
        name: num.toString(),
        value: num,
        bgColor: bgColors[index % bgColors.length],
        color: textColor,
        probability: probability
    }));

    console.log("Generated prizesCanvas:", prizesCanvas.value);
}
</script>

<template>
    <div>
        <div class="christmas-background surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
            
            <!-- Falling snowflakes -->
            <div class="snowflakes">
                <div v-for="n in 30" :key="n" class="snowflake" 
                     :style="{ 
                         left: Math.random() * 100 + '%',
                         animationDelay: Math.random() * 5 + 's',
                         animationDuration: (10 + Math.random() * 10) + 's'
                     }">
                    ❅
                </div>
            </div>

            <!-- Confetti -->
            <div v-if="showConfetti" class="confetti-container">
                <div v-for="piece in confettiPieces" 
                     :key="piece.id"
                     class="confetti"
                     :style="{
                         left: piece.left + '%',
                         backgroundColor: piece.color,
                         animationDelay: piece.delay + 's',
                         animationDuration: piece.duration + 's'
                     }">
                </div>
            </div>

            <div class="flex flex-column align-items-center justify-content-center">
                <!-- Christmas Title -->
                <div class="christmas-title text-center mb-5 animate-bounce">
                    <h1 class="text-8xl font-bold text-white mb-3 title-glow">
                        ⭐ FN Santa Wheel ⭐
                    </h1>
                    <!-- <p class="text-4xl text-yellow-300 font-semibold sparkle-text">
                        ✨ Spin to Win! ✨
                    </p> -->
                </div>

                <div class="wheel-container"
                    style="border-radius: 56px; padding: 0.5rem; background: linear-gradient(180deg, rgba(212, 175, 55, 0.6) 10%, rgba(212, 175, 55, 0) 30%)">
                    <div class="w-full surface-card py-8 px-5 sm:px-8 flex flex-column align-items-center wheel-glow"
                        style="border-radius: 53px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">

                        <SpinTheWheel 
                            style="width: 600px; max-width: 100%;" 
                            :verify="canvasVerify"
                            :canvas="canvasOptions" 
                            :prizes="prizesCanvas" 
                            @rotateStart="onCanvasRotateStart"
                            @rotateEnd="onRotateEnd" 
                        />
                        
                        <!-- Remaining count -->
                        <!-- <div class="mt-4 text-white text-3xl font-bold remaining-count">
                            Remaining: <span class="text-yellow-300">{{ audienceNumbersArray.length }}</span>
                        </div> -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Winner Dialog - Minimalistic & Beautiful -->
        <Dialog v-model:visible="winnerdialog" modal 
                :style="{ width: '100vw', height: '100vh', maxHeight: '100vh' }"
                class="winner-dialog"
                :dismissableMask="false"
                :closable="false">
            
            <div class="winner-minimal">
                <!-- Subtle animated background -->
                <div class="minimal-stars">
                    <div v-for="n in 15" :key="n" class="star-minimal"
                         :style="{
                             left: Math.random() * 100 + '%',
                             top: Math.random() * 100 + '%',
                             animationDelay: Math.random() * 3 + 's'
                         }">
                        ❅
                    </div>
                </div>

                <!-- Main content -->
                <div class="winner-card">
                    <div class="winner-number-minimal">
                        {{ winner.num }}
                    </div>

                    <button @click="winnerdialog = false" class="continue-btn-minimal">
                        Continue
                    </button>
                </div>
            </div>
        </Dialog>
    </div>
    <AppConfig simple />
</template>

<style scoped>
/* Christmas Background */
.christmas-background {
    background: linear-gradient(135deg, #8b0000 0%, #006400 50%, #8b0000 100%);
    position: relative;
    overflow: hidden;
}

.surface-ground {
    background-image: url('/vecimg/back_fn.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    height: 100vh;
}

/* Snowflakes */
.snowflakes {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
}

.snowflake {
    position: absolute;
    top: -20px;
    color: white;
    font-size: 1.5em;
    opacity: 0.8;
    animation: fall linear infinite;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

@keyframes fall {
    to {
        transform: translateY(100vh);
    }
}

/* Confetti */
.confetti-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
}

.confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    top: -20px;
    animation: confetti-fall linear infinite;
}

@keyframes confetti-fall {
    to {
        transform: translateY(100vh) rotate(360deg);
    }
}

/* Title Animations */
.title-glow {
    text-shadow: 
        0 0 20px rgba(255, 255, 255, 0.8),
        0 0 40px rgba(255, 215, 0, 0.6),
        0 0 60px rgba(255, 215, 0, 0.4);
    animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
    0%, 100% {
        text-shadow: 
            0 0 20px rgba(255, 255, 255, 0.8),
            0 0 40px rgba(255, 215, 0, 0.6),
            0 0 60px rgba(255, 215, 0, 0.4);
    }
    50% {
        text-shadow: 
            0 0 30px rgba(255, 255, 255, 1),
            0 0 60px rgba(255, 215, 0, 0.8),
            0 0 90px rgba(255, 215, 0, 0.6);
    }
}

.sparkle-text {
    animation: sparkle 1.5s ease-in-out infinite;
}

@keyframes sparkle {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.8;
        transform: scale(1.05);
    }
}

.animate-bounce {
    animation: gentle-bounce 2s ease-in-out infinite;
}

@keyframes gentle-bounce {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
}

/* Wheel Container */
.wheel-container {
    animation: wheel-float 3s ease-in-out infinite;
}

@keyframes wheel-float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-10px);
    }
}

.wheel-glow {
    box-shadow: 
        0 0 30px rgba(212, 175, 55, 0.4),
        0 0 60px rgba(212, 175, 55, 0.2),
        inset 0 0 20px rgba(255, 255, 255, 0.1);
}

.remaining-count {
    text-shadow: 
        0 0 10px rgba(255, 215, 0, 0.8),
        0 0 20px rgba(255, 215, 0, 0.6);
    animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}

/* Winner Dialog - Minimalistic & Beautiful */
:deep(.winner-dialog) {
    margin: 0 !important;
}

:deep(.winner-dialog .p-dialog) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    border-radius: 0 !important;
}

:deep(.winner-dialog .p-dialog-content) {
    padding: 0 !important;
    margin: 0 !important;
    height: 100vh !important;
    width: 100vw !important;
    background: transparent !important;
    overflow: hidden !important;
}

:deep(.winner-dialog .p-dialog-header) {
    display: none !important;
}

.winner-minimal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

/* Subtle stars */
.minimal-stars {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
}

.star-minimal {
    position: absolute;
    color: rgba(255, 255, 255, 0.3);
    font-size: clamp(1rem, 2vw, 2rem);
    animation: gentle-fall 10s linear infinite;
}

@keyframes gentle-fall {
    to {
        transform: translateY(100vh);
        opacity: 0;
    }
}

/* Winner card */
.winner-card {
    position: relative;
    z-index: 10;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24px;
    padding: clamp(3rem, 8vw, 8rem) clamp(4rem, 10vw, 12rem);
    box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(2rem, 5vh, 4rem);
    animation: card-entrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes card-entrance {
    0% {
        transform: scale(0.8);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.winner-number-minimal {
    font-size: clamp(6rem, 20vw, 18rem);
    font-weight: 900;
    color: #2c5530;
    line-height: 1;
    text-align: center;
    animation: number-scale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}

@keyframes number-scale {
    0% {
        transform: scale(0);
    }
    100% {
        transform: scale(1);
    }
}

.continue-btn-minimal {
    padding: clamp(0.75rem, 2vh, 1.25rem) clamp(2rem, 6vw, 4rem);
    font-size: clamp(1.25rem, 3vw, 2rem);
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #c41e3a 0%, #165b33 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    animation: button-appear 0.4s ease-out 0.5s both;
}

@keyframes button-appear {
    0% {
        transform: translateY(20px);
        opacity: 0;
    }
    100% {
        transform: translateY(0);
        opacity: 1;
    }
}

.continue-btn-minimal:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.continue-btn-minimal:active {
    transform: translateY(0);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .text-8xl {
        font-size: 4rem;
    }
    .text-4xl {
        font-size: 2rem;
    }
    .winner-number {
        font-size: 6rem;
    }
}
</style>