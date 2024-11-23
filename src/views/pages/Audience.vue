<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount, computed } from 'vue';
import ProductService from '@/service/ProductService';
import AudienceService from '@/service/AudienceService';
import { useToast } from 'primevue/usetoast';

import { doc, setDoc, serverTimestamp, updateDoc, deleteDoc, collection, getDocs, getFirestore, runTransaction } from "firebase/firestore";

import { db } from '../../firebase/init.js';


const toast = useToast();

const products = ref(null);
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref({});
const selectedProducts = ref(null);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const statuses = ref([
    { label: 'INSTOCK', value: 'instock' },
    { label: 'LOWSTOCK', value: 'lowstock' },
    { label: 'OUTOFSTOCK', value: 'outofstock' }
]);

const aud = ref([
    {
        "id": "1",
        "firstname": "Kojo",
        "lastname": "Larbi",
        "email": "john.doe@example.com",
        "phone": "0592680355",
        "events_attended": ["Event A", "Event B"],
        "category": "regular",
        "registered_on": "2023-09-20",
        "registered_by": "admin1"
    },
    {
        "id": "2",
        "firstname": "Selorm",
        "lastname": "Selawoka",
        "email": "jane.smith@example.com",
        "phone": "233209335976",
        "events_attended": ["Event A", "Event C", "Event D"],
        "category": "vip",
        "registered_on": "2023-09-19",
        "registered_by": "admin2"
    },
    {
        "id": "3",
        "firstname": "Sydney",
        "lastname": "Odoi",
        "email": "alice.johnson@example.com",
        "phone": "0262666575",
        "events_attended": ["Event B", "Event D"],
        "category": "regular",
        "registered_on": "2023-09-18",
        "registered_by": "admin3"
    },
    {
        "id": "4",
        "firstname": "Moses",
        "lastname": "Ogyadu",
        "email": "bob.williams@example.com",
        "phone": "233269751985",
        "events_attended": ["Event A"],
        "category": "vvip",
        "registered_on": "2023-09-17",
        "registered_by": "admin1"
    },
    {
        "id": "5",
        "firstname": "Esmond",
        "lastname": "Luuse",
        "email": "charlie.brown@example.com",
        "phone": "0203436424",
        "events_attended": ["Event C", "Event D"],
        "category": "vip",
        "registered_on": "2023-09-16",
        "registered_by": "admin2"
    },
]);
const audiences = ref([]);
const audienceDialog = ref(false);
const deleteAudienceDialog = ref(false);
const deleteAudiencesDialog = ref(false);
const audience = ref({});
const selectedAudiences = ref(null);


const productService = new ProductService();
const audienceService = new AudienceService();


//let collectionName = 'audiences';
let collectionName = 'uat_audiences';

const fetchAudiences = async () => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    let audiencesDatas = [];
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        //console.log(doc.id, " => ", doc.data());
        //Add the document id to the data object
        doc.data().id = doc.id;
        //doc.data().registered = doc.data().events_attended.includes('hod');

        // console.log(doc.data().registered);
        // console.log(doc.data().events_attended);
        const audienceData = doc.data();
        audienceData.id = doc.id;

        if (audienceData.events_attended.includes('fn11')) {
            //console.log('yes');
            audienceData.registered = true;
        } else {
            //console.log('no');
            audienceData.registered = false;
        }



        audiencesDatas.push(audienceData);
    });

    audiences.value = audiencesDatas;
};


// const fetchAudiences = async () => {
//     audiences.value = aud.value;
// }

onBeforeMount(() => {
    initFilters();
});
onMounted(() => {

    fetchAudiences();
    generateRegNumber();

});
const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const openNew = () => {
    audience.value = {};
    submitted.value = false;
    audienceDialog.value = true;
};

const hideDialog = () => {
    audienceDialog.value = false;
    submitted.value = false;
};

const saveAudience = async () => {
    submitted.value = true;
    if (audience.value.firstname && audience.value.lastname.trim() && audience.value.phone) {
        if (audience.value.id) {
            audiences.value[findIndexById(audience.value.id)] = audience.value;
            await updateDoc(doc(db, collectionName, audience.value.id),
                audience.value
            ).then(() => {
                console.log("Document successfully updated!");
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Audience Updated', life: 3000 });
                //Send sms to the user
                //sendSMS(audience.value);
                fetchAudiences();

            }).catch((error) => {
                // The document probably doesn't exist.
                console.error("Error updating document: ", error);
            });
            //toast.add({ severity: 'success', summary: 'Successful', detail: 'Audience Updated', life: 3000 });

        } else {

            const regNumber = await generateRegNumber();

            audience.value.id = createId();

            audience.events_attended = ['fn11'];

            audience.registered_on = serverTimestamp();
            audience.registered_by = 'admin1';
            audience.regNumber = regNumber;



            const docData = {
                id: audience.value.id,
                firstname: audience.value.firstname,
                lastname: audience.value.lastname,
                email: audience.value.email ? audience.value.email : '',
                phone: audience.value.phone,
                category: audience.value.category,
                //Events attended- an array of event ids
                events_attended: ['fn11'],
                registered_on: serverTimestamp(),
                registered_by: 'admin1',
                regNumber: regNumber
            };

            //Add a new document to audiences collection
            await setDoc(doc(db, collectionName, audience.value.id), docData).then(() => {
                console.log("Document successfully written!");
                audiences.value.push(audience.value);
                toast.add({ severity: 'success', summary: 'Successful', detail: `Audience Created With RegNumber ${audience.regNumber}`, life: 3000 });


                sendSMS(audience.value);
                fetchAudiences();


            }).catch((error) => {
                console.error("Error writing document: ", error);
            });
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Audience Created', life: 3000 });
        }
        audienceDialog.value = false;
        audience.value = {};
    }
};

const editAudience = async (editAudience) => {
    audience.value = { ...editAudience };
    console.log(audience);
    audienceDialog.value = true;
};

const confirmDeleteAudience = (editAudience) => {
    audience.value = editAudience;

    deleteAudienceDialog.value = true;
};

const deleteAudience = async () => {
    audiences.value = audiences.value.filter((val) => val.id !== audience.value.id);
    await deleteDoc(doc(db, audience.value, audience.value.id));

    deleteAudienceDialog.value = false;
    audience.value = {};
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Audience Deleted', life: 3000 });


};

const findIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < audiences.value.length; i++) {
        if (audiences.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const createId = () => {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const confirmDeleteSelected = () => {
    deleteAudiencesDialog.value = true;
};
const deleteSelectedAudiences = () => {
    audiences.value = audiences.value.filter((val) => !selectedAudiences.value.includes(val));
    deleteAudiencesDialog.value = false;
    selectedAudiences.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Audiences Deleted', life: 3000 });
};

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },

    };
};

//Computed property to check if email is valid
const isValidEmail = computed(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(audience.value.email);
});


const categoryClass = (category) => {
    if (category == 'regular') return 'pill regular';
    else if (category == 'special') return 'pill special';
    else return 'pill patron';
};

const categoryLabel = (category) => {
    if (category == 'regular') return 'Regular';
    else if (category == 'special') return 'Special';
    else return 'Patron';
};

//Registering user
const toggleRegistration = (data) => {
    if (data.registered) {
        registerUser(data);

    } else {
        deregisterUser(data);
    }
}

// toggleRegistration(data) {
//     if (data.registered) {
//         if (!data.events_attended.includes("hod")) {
//             data.events_attended.push("hod");
//         }
//     } else {
//         const index = data.events_attended.indexOf("hod");
//         if (index > -1) {
//             data.events_attended.splice(index, 1);
//         }
//     }

//     // Any additional logic or API calls related to the toggling action can be done here.
// }

const registerUser = async (data) => {
    if (data.events_attended.includes('fn11')) {
        toast.add({
            severity: 'info',
            summary: 'Already Registered',
            detail: `${data.firstname} is already registered`,
            life: 3000
        });
        // Toggle the switch back to true
        data.registered = false;
        return;
    } else {
        try {
            // Generate a unique registration number
            const regNumber = await generateRegNumber();

            // Update the user's data with the new event and regNumber
            data.events_attended.push('fn11');
            data.regNumber = regNumber;

            await updateDoc(doc(db, collectionName, data.id), data);

            console.log("Document successfully updated!");

            toast.add({
                severity: 'success',
                summary: 'Registered',
                detail: `${data.firstname} registered successfully`,
                life: 3000
            });

            // Send SMS to the user
            sendSMS(data);

            // Fetch updated audiences
            fetchAudiences();

        } catch (error) {
            // Handle errors gracefully
            data.registered = false;
            console.error("Error registering user: ", error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'An error occurred while registering the user.',
                life: 3000
            });
        }
    }
};


const sendSMS = (data) => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        ...data,
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("https://vecbackend-production.up.railway.app/sms", requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .then(() => {
            toast.add({ severity: 'success', summary: 'SMS Sent', detail: `SMS sent to ${data.firstname}`, life: 3000 });
        })
        .catch(error => console.log('error', error));
}

const deregisterUser = (data) => {
    if (!data.events_attended.includes('fn11')) {
        toast.add({ severity: 'info', summary: 'Already Unregistered', detail: `${data.firstname} is already unregistered`, life: 3000 });
        //toggle the switch back to true
        data.registered = true;
        return;
    } else {
        data.events_attended = data.events_attended.filter((val) => val !== 'fn11');
        updateDoc(doc(db, collectionName, data.id),
            data
        ).then(() => {
            console.log("Document successfully updated!");
            const index = data.events_attended.indexOf("fn11");
            if (index > -1) {
                data.events_attended.splice(index, 1);
            }
            toast.add({ severity: 'info', summary: 'Unregistered', detail: `${data.firstname} unregistered successfully`, life: 3000 });
        }).catch((error) => {
            // The document probably doesn't exist.
            data.registered = true;
            console.error("Error updating document: ", error);
        });
    }
}


const generateRegNumber = async () => {


    //const counterDoc = doc(db, "counters/eventCounter");

    let colName = 'counters';
    const querySnapshot = await getDocs(collection(db, colName));

    //Get the eventCounter document
    let counterDoc;
    querySnapshot.forEach((doc) => {
        if (doc.id === 'fnCounter') {
            counterDoc = doc.ref;
        }
    });

    console.log(counterDoc);

    try {
        const userNumber = await runTransaction(db, async (transaction) => {
            const counterSnapshot = await transaction.get(counterDoc);
            const current = counterSnapshot.data()?.current || 0;
            const newValue = current + 1;

            transaction.update(counterDoc, { current: newValue });
            return newValue;
        });



        console.log(`User registered with number: ${userNumber}`);
        //Return the number as a number
        return userNumber;
    } catch (error) {
        console.error("Transaction failed: ", error);
    }
};


</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Toast />
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="openNew" />
                            <Button label="Delete" icon="pi pi-trash" class="p-button-danger"
                                @click="confirmDeleteSelected"
                                :disabled="!selectedAudiences || !selectedAudiences.length" />
                        </div>
                    </template>

                    <template v-slot:end>
                        <!-- <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" chooseLabel="Import"
                            class="mr-2 inline-block" /> -->
                        <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV($event)" />
                    </template>
                </Toolbar>

                <DataTable ref="dt" :value="audiences" dataKey="id" :paginator="true" :rows="10" :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} audiences"
                    :globalFilterFields="['firstname', 'lastname', 'email', 'phone', 'category']"
                    responsiveLayout="scroll">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Manage Audience</h5>
                            <span class="block mt-2 md:mt-0 p-input-icon-left">
                                <i class="pi pi-search" />
                                <InputText v-model="filters['global'].value" placeholder="Search..." />
                            </span>
                        </div>
                    </template>



                    <Column headerStyle="width: 3rem;" header="Register">
                        <template #body="slotProps">
                            <InputSwitch v-model="slotProps.data.registered"
                                @change="toggleRegistration(slotProps.data)" />
                        </template>

                    </Column>

                    <Column field="category" header="Category" :sortable="true" headerStyle="width:5%; min-width:5px;"
                        :filter="true">
                        <template #body="slotProps">
                            <span :class="categoryClass(slotProps.data.category)">
                                {{ categoryLabel(slotProps.data.category) }}
                            </span>
                        </template>
                    </Column>
                    <Column field="name" header="FirstName" :sortable="true" headerStyle="width:10%; min-width:5rem;"
                        :filter="true">
                        <template #body="slotProps">
                            <span class="p-column-title">FirstName</span>
                            {{ slotProps.data.firstname }}
                        </template>
                    </Column>
                    <Column field="name" header="LastName" :sortable="true" headerStyle="width:10%; min-width:5rem;"
                        :filter="true">
                        <template #body="slotProps">
                            <span class="p-column-title">LastName</span>
                            {{ slotProps.data.lastname }}
                        </template>
                    </Column>
                    <Column field="price" header="Email" :sortable="true" headerStyle="width:10%; min-width:5rem;"
                        :filter="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Email</span>
                            {{ slotProps.data.email }}
                        </template>
                    </Column>

                    <Column field="price" header="Phone" :sortable="true" headerStyle="width:10%; min-width:5rem;"
                        :filter="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Phone</span>
                            {{ slotProps.data.phone }}
                        </template>
                    </Column>

                    <Column field="regNumber" header="RegNumber" :sortable="true"
                        headerStyle="width:10%; min-width:5rem;" :filter="true">
                        <template #body="slotProps">
                            <span class="p-column-title">RegNumber</span>
                            {{ slotProps.data.regNumber }}
                        </template>
                    </Column>


                    <Column headerStyle="min-width:10rem;">
                        <template #body="slotProps">
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2"
                                @click="editAudience(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2"
                                @click="confirmDeleteAudience(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <Dialog v-model:visible="audienceDialog" :style="{ width: '450px' }" header="Audience Details"
                    :modal="true" class="p-fluid">
                    <img :src="'demo/images/product/' + product.image" :alt="product.image" v-if="product.image"
                        width="150" class="mt-0 mx-auto mb-5 block shadow-2" />
                    <div class="field">
                        <label for="name">Firstname</label>
                        <InputText id="name" v-model.trim="audience.firstname" required="true" autofocus
                            :class="{ 'p-invalid': submitted && !audience.firstname }" />
                        <small class="p-invalid" v-if="submitted && !audience.firstname">First name is required.</small>
                    </div>
                    <div class="field">
                        <label for="name">Lastname</label>
                        <InputText id="name" v-model.trim="audience.lastname" required="true" autofocus
                            :class="{ 'p-invalid': submitted && !audience.lastname }" />
                        <small class="p-invalid" v-if="submitted && !audience.lastname">Last name is required.</small>
                    </div>
                    <div class="field">
                        <label for="name">Email</label>
                        <InputText id="name" v-model.trim="audience.email" required="true" autofocus type="email"
                            :class="{ 'p-invalid': submitted && audience.email && !isValidEmail }" />
                        <!-- <small class="p-invalid" v-if="submitted && !audience.email">Email is required.</small> -->
                        <small class="p-invalid" v-if="submitted && audience.email && !isValidEmail">Email is not
                            valid.</small>
                    </div>
                    <div class="field">
                        <label for="name">Phone</label>
                        <InputText id="name" v-model.trim="audience.phone" required="true" autofocus
                            :class="{ 'p-invalid': submitted && !audience.phone }" />
                        <small class="p-invalid" v-if="submitted && !audience.phone">Phone number is required.</small>
                    </div>



                    <div class="field">
                        <label class="mb-3">Category</label>
                        <div class="formgrid grid">
                            <div class="field-radiobutton col-6">
                                <RadioButton id="category1" name="category" value="regular"
                                    v-model="audience.category" />
                                <label for="category1">Regular</label>
                            </div>
                            <div class="field-radiobutton col-6">
                                <RadioButton id="category2" name="category" value="special"
                                    v-model="audience.category" />
                                <label for="category2">Special Guest</label>
                            </div>
                            <div class="field-radiobutton col-6">
                                <RadioButton id="category3" name="category" value="patron"
                                    v-model="audience.category" />
                                <label for="category3">Patron</label>
                            </div>

                        </div>
                    </div>


                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
                        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveAudience" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteAudienceDialog" :style="{ width: '450px' }" header="Confirm"
                    :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="audience">Are you sure you want to delete <b>{{ audience.firstname }}</b>?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text"
                            @click="deleteAudienceDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteAudience" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteAudiencesDialog" :style="{ width: '450px' }" header="Confirm"
                    :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="product">Are you sure you want to delete the selected audiences?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text"
                            @click="deleteAudiencesDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteSelectedAudiences" />
                    </template>
                </Dialog>



            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.pill {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 20px;
    color: white;
    font-weight: bold;
}

.pill.regular {
    background-color: #3498db;
    /* Example color for 'Regular' */
}

.pill.special {
    background-color: #e74c3c;
    /* Example color for 'Special Guest' */
}

.pill.patron {
    background-color: #2ecc71;
    /* Example color for 'Patron' */
}
</style>
