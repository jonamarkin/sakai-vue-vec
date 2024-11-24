<script setup>
import AppConfig from '@/layout/AppConfig.vue';


import { ref, computed, onMounted } from 'vue'
import { SpinTheWheel } from 'vue-spin-the-wheel'
import 'vue-spin-the-wheel/style.css'
import { doc, setDoc, serverTimestamp, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

import { db } from '../../firebase/init.js';

const prizeId = ref(0)
const winnerdialog = ref(false)

const audienceNumbersArray = ref([]);

let winner = ref({

    num: '01',
    name: 'VocalEssence Chorale',
})

const wheelEl = ref()
const canvasVerify = ref(false) // Whether the turntable in canvas mode is enabled for verification
const verifyDuration = 2
const canvasOptions = {
    btnWidth: 140,
    borderColor: '#584b43',
    borderWidth: 6,
    lineHeight: 30
}

let prizesCanvas = ref([
    {
        id: 1, //* The unique id of each prize, an integer greater than 0
        name: 'Blue', // Prize name, display value when type is canvas (this parameter is not needed when type is image)
        value: 'Blue\'s value', //* Prize value, return value after spinning
        bgColor: '#45ace9', // Background color (no need for this parameter when type is image)
        color: '#ffffff', // Font color (this parameter is not required when type is image)
        probability: 20 //* Probability, up to 4 decimal places (the sum of the probabilities of all prizes
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
    //wheelEl.value.startRotate() // Can start rotation
    await fetchAudienceNumber();
    generatePrizesCanvas();
})

// Simulate the request back-end interface
function testRequest(verified, duration) { // verified: whether to pass the verification, duration: delay time
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(verified)
        }, duration)
    })
}

function onCanvasRotateStart(rotate) {
    if (canvasVerify.value) {
        const verified = true // true: the test passed the verification, false: the test failed the verification
        testRequest(verified, verifyDuration * 1000).then((verifiedRes) => {
            if (verifiedRes) {
                console.log('Verification passed, start to rotate')
                rotate() // Call the callback, start spinning
                canvasVerify.value = false // Turn off verification mode
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
    // alert(prize.value)
    winnerdialog.value = true
    console.log('onRotateEnd', prize)
    winner.value.name = prize.value
    winner.value.num = prize.value

    //Regerate the prizesCanvas
    generatePrizesCanvas();
}

function onChangePrize(id) {
    prizeId.value = id
}


//let collectionName = 'audiences';
let collectionName = 'uat_audiences';

const fetchAudienceNumber = async () => {
    //Fetch the number in the collection that have fn11 in their events_attended array
    const querySnapshot = await getDocs(collection(db, collectionName));

    querySnapshot.forEach((doc) => {
        //console.log(doc.id, " => ", doc.data());
        audienceNumbersArray.value.push(doc.data().regNumber);
    });
};



function generatePrizesCanvas(numPrizes = 5) {
    // Ensure the number of prizes doesn't exceed the available numbers
    if (audienceNumbersArray.value.length < numPrizes) {
        throw new Error("Not enough numbers in the array to pick prizes.");
    }

    // Shuffle the array and pick the first `numPrizes` numbers
    const shuffled = [...audienceNumbersArray.value].sort(() => Math.random() - 0.5);
    const selectedNumbers = shuffled.slice(0, numPrizes);

    // Colors for background and text
    const bgColors = ['#45ace9', '#dd3832', '#fef151', '#7ac143', '#a349a4'];
    const textColor = '#ffffff';

    // Calculate equal probability
    const probability = +(100 / numPrizes).toFixed(4);

    // Generate prizesCanvas
    prizesCanvas.value = selectedNumbers.map((num, index) => ({
        id: num, // Use the number itself as the ID
        name: num.toString(),
        value: num,
        bgColor: bgColors[index % bgColors.length],
        color: textColor,
        probability: probability
    }));


    console.log("Audience numbers:", audienceNumbersArray.value);
    console.log("Selected numbers:", selectedNumbers);
    console.log("Generated prizesCanvas:", prizesCanvas.value);


    //Remove the selected numbers from the array so that they are not selected again
    selectedNumbers.forEach((num) => {
        const index = audienceNumbersArray.value.indexOf(num);
        if (index > -1) {
            audienceNumbersArray.value.splice(index, 1);
        }
    });

    console.log("Remaining numbers:", audienceNumbersArray.value);

}

// // Example usage
// const numbersArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// const prizesCanvas = generatePrizesCanvas(numbersArray);
// console.log(prizesCanvas);


</script>




<template>
    <div>
        <!-- type: image -->
        <!-- <SpinTheWheel style="width: 500px; max-width: 100%;" ref="wheelEl" type="image" :useWeight="true"
            :verify="canvasVerify" :prizeId="prizeId" :angleBase="-2" :prizes="prizesImage"
            @rotateStart="onImageRotateStart" @rotateEnd="onRotateEnd">
            <template #wheel>
                <img src="./assets/wheel.png" style="width: 100%;transform: rotateZ(60deg)" />
            </template>
<template #button>
                <img src="./assets/button.png" style="width: 180px" />
            </template>
</SpinTheWheel> -->


        <div
            class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-column align-items-center justify-content-center">
                <!-- <img src="/vecimg/fn-text.png" alt="Sakai logo" class="mb-5 w-6rem flex-shrink-0" /> -->
                <div
                    style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, rgba(33, 150, 243, 0.4) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full surface-card py-8 px-5 sm:px-8 flex flex-column align-items-center"
                        style="border-radius: 53px">

                        <SpinTheWheel style="width: 500px; max-width: 100%;" :verify="canvasVerify"
                            :canvas="canvasOptions" :prizes="prizesCanvas" @rotateStart="onCanvasRotateStart"
                            @rotateEnd="onRotateEnd" />
                    </div>
                </div>
            </div>
        </div>
        <!-- type: canvas -->

        <Dialog v-model:visible="winnerdialog" modal :style="{ width: '50rem' }"
            :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <div class="text-center justify-content">
                <p class="m-0">
                    <span class="text-8xl">{{ winner.num }}</span>
                </p>
                <!-- <p class="mt-1">
                    Name: {{ winner.name }}
                </p> -->
            </div>

        </Dialog>

    </div>
    <AppConfig simple />
</template>


<style scoped>
/*
Add background image to this component
*/
.surface-ground {
    background-image: url('/vecimg/back_fn.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    /*Make the height be th vh */
    height: 100vh;
}
</style>
