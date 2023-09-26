<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount, computed } from 'vue';
import ProductService from '@/service/ProductService';
import AudienceService from '@/service/AudienceService';
import { useToast } from 'primevue/usetoast';

import { doc, setDoc, serverTimestamp, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

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

const audiences = ref([]);
const audienceDialog = ref(false);
const deleteAudienceDialog = ref(false);
const deleteAudiencesDialog = ref(false);
const audience = ref({});
const selectedAudiences = ref(null);


const productService = new ProductService();
const audienceService = new AudienceService();

const fetchAudiences = async () => {
    const querySnapshot = await getDocs(collection(db, "audiences"));
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.id, " => ", doc.data());
        //Add the document id to the data object
        doc.data().id = doc.id;

        audiences.value.push(doc.data());
    });
};

onBeforeMount(() => {
    initFilters();
});
onMounted(() => {
    // productService.getProducts().then((data) => (products.value = data));
    //audienceService.getAudience().then((data) => (audiences.value = data));
    fetchAudiences();

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
    if (audience.value.firstname && audience.value.lastname.trim() && audience.value.phone && audience.value.email && isValidEmail.value) {
        if (audience.value.id) {
            //audience.value.inventoryStatus = product.value.inventoryStatus.value ? product.value.inventoryStatus.value : product.value.inventoryStatus;
            audiences.value[findIndexById(audience.value.id)] = audience.value;
            //Update the document in the audiences collection
            await updateDoc(doc(db, "audiences", audience.value.id),
                audience.value
            ).then(() => {
                console.log("Document successfully updated!");
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Audience Updated', life: 3000 });
            }).catch((error) => {
                // The document probably doesn't exist.
                console.error("Error updating document: ", error);
            });
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Audience Updated', life: 3000 });

        } else {
            audience.value.id = createId();
            // audience.value.firstname
            // product.value.image = 'product-placeholder.svg';
            // product.value.inventoryStatus = product.value.inventoryStatus ? product.value.inventoryStatus.value : 'INSTOCK';
            audience.events_attended = ['hod'];

            audience.registered_on = serverTimestamp();
            audience.registered_by = 'admin1';
            //audiences.value.push(audience.value);


            const docData = {
                id: audience.value.id,
                firstname: audience.value.firstname,
                lastname: audience.value.lastname,
                email: audience.value.email,
                phone: audience.value.phone,
                category: audience.value.category,
                //Events attended- an array of event ids
                events_attended: ['hod'],
                registered_on: serverTimestamp(),
                registered_by: 'admin1'
            };

            //Add a new document to audiences collection
            await setDoc(doc(db, "audiences", audience.value.id), docData).then(() => {
                console.log("Document successfully written!");
                audiences.value.push(audience.value);
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Audience Created', life: 3000 });
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
    //     .then(() => {
    //         console.log("Document successfully deleted!");

    //     }).catch((error) => {
    //         console.error("Error removing document: ", error);
    //     })
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
        // firstname: { value: null, matchMode: FilterMatchMode.CONTAINS },
        // lastname: { value: null, matchMode: FilterMatchMode.CONTAINS },
        // email: { value: null, matchMode: FilterMatchMode.CONTAINS },
        // phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
        // category: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

//Computed property to check if email is valid
const isValidEmail = computed(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(audience.value.email);
});
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
                            <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelected"
                                :disabled="!selectedAudiences || !selectedAudiences.length" />
                        </div>
                    </template>

                    <template v-slot:end>
                        <!-- <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" chooseLabel="Import"
                            class="mr-2 inline-block" /> -->
                        <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV($event)" />
                    </template>
                </Toolbar>

                <DataTable ref="dt" :value="audiences" v-model:selection="selectedAudiences" dataKey="id" :paginator="true"
                    :rows="10" :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} audiences"
                    :globalFilterFields="['firstname', 'lastname', 'email', 'phone', 'category']" responsiveLayout="scroll">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Manage Audience</h5>
                            <span class="block mt-2 md:mt-0 p-input-icon-left">
                                <i class="pi pi-search" />
                                <InputText v-model="filters['global'].value" placeholder="Search..." />
                            </span>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    <!-- <Column field="code" header="Code" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">Code</span>
                            {{ slotProps.data.code }}
                        </template>
                    </Column> -->
                    <Column field="name" header="FirstName" :sortable="true" headerStyle="width:20%; min-width:10rem;"
                        :filter="true">
                        <template #body="slotProps">
                            <span class="p-column-title">FirstName</span>
                            {{ slotProps.data.firstname }}
                        </template>
                    </Column>
                    <Column field="name" header="LastName" :sortable="true" headerStyle="width:20%; min-width:10rem;"
                        :filter="true">
                        <template #body="slotProps">
                            <span class="p-column-title">LastName</span>
                            {{ slotProps.data.lastname }}
                        </template>
                    </Column>
                    <Column field="price" header="Email" :sortable="true" headerStyle="width:20%; min-width:8rem;"
                        :filter="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Email</span>
                            {{ slotProps.data.email }}
                        </template>
                    </Column>
                    <!-- <Column header="Image" headerStyle="width:14%; min-width:10rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">Image</span>
                            <img :src="'demo/images/product/' + slotProps.data.image" :alt="slotProps.data.image"
                                class="shadow-2" width="100" />
                        </template>
                    </Column> -->
                    <Column field="price" header="Phone" :sortable="true" headerStyle="width:20%; min-width:8rem;"
                        :filter="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Phone</span>
                            {{ slotProps.data.phone }}
                        </template>
                    </Column>
                    <Column field="category" header="Category" :sortable="true" headerStyle="width:20%; min-width:10rem;"
                        :filter="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Category</span>
                            {{ slotProps.data.category }}
                        </template>
                    </Column>
                    <!-- <Column field="rating" header="Reviews" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">Rating</span>
                            <Rating :modelValue="slotProps.data.rating" :readonly="true" :cancel="false" />
                        </template>
                    </Column> -->
                    <!-- <Column field="inventoryStatus" header="Status" :sortable="true"
                        headerStyle="width:14%; min-width:10rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">Status</span>
                            <span
                                :class="'product-badge status-' + (slotProps.data.inventoryStatus ? slotProps.data.inventoryStatus.toLowerCase() : '')">{{
                                    slotProps.data.inventoryStatus }}</span>
                        </template>
                    </Column> -->
                    <Column headerStyle="min-width:10rem;">
                        <template #body="slotProps">
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2"
                                @click="editAudience(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2"
                                @click="confirmDeleteAudience(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <Dialog v-model:visible="audienceDialog" :style="{ width: '450px' }" header="Audience Details" :modal="true"
                    class="p-fluid">
                    <img :src="'demo/images/product/' + product.image" :alt="product.image" v-if="product.image" width="150"
                        class="mt-0 mx-auto mb-5 block shadow-2" />
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

                    <!-- <div class="field">
                        <label for="inventoryStatus" class="mb-3">Inventory Status</label>
                        <Dropdown id="inventoryStatus" v-model="product.inventoryStatus" :options="statuses"
                            optionLabel="label" placeholder="Select a Status">
                            <template #value="slotProps">
                                <div v-if="slotProps.value && slotProps.value.value">
                                    <span :class="'product-badge status-' + slotProps.value.value">{{ slotProps.value.label
                                    }}</span>
                                </div>
                                <div v-else-if="slotProps.value && !slotProps.value.value">
                                    <span :class="'product-badge status-' + slotProps.value.toLowerCase()">{{
                                        slotProps.value }}</span>
                                </div>
                                <span v-else>
                                    {{ slotProps.placeholder }}
                                </span>
                            </template>
                        </Dropdown>
                    </div> -->

                    <div class="field">
                        <label class="mb-3">Category</label>
                        <div class="formgrid grid">
                            <div class="field-radiobutton col-6">
                                <RadioButton id="category1" name="category" value="regular" v-model="audience.category" />
                                <label for="category1">Regular</label>
                            </div>
                            <div class="field-radiobutton col-6">
                                <RadioButton id="category2" name="category" value="vip" v-model="audience.category" />
                                <label for="category2">VIP</label>
                            </div>
                            <div class="field-radiobutton col-6">
                                <RadioButton id="category3" name="category" value="vvip" v-model="audience.category" />
                                <label for="category3">VVIP</label>
                            </div>
                            <!-- <div class="field-radiobutton col-6">
                                <RadioButton id="category4" name="category" value="Fitness" v-model="audience.category" />
                                <label for="category4">Fitness</label>
                            </div> -->
                        </div>
                    </div>

                    <!-- <div class="formgrid grid">
                        <div class="field col">
                            <label for="price">Price</label>
                            <InputNumber id="price" v-model="product.price" mode="currency" currency="USD" locale="en-US"
                                :class="{ 'p-invalid': submitted && !product.price }" :required="true" />
                            <small class="p-invalid" v-if="submitted && !product.price">Price is required.</small>
                        </div>
                        <div class="field col">
                            <label for="quantity">Quantity</label>
                            <InputNumber id="quantity" v-model="product.quantity" integeronly />
                        </div>
                    </div> -->
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
                        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveAudience" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteAudienceDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="audience">Are you sure you want to delete <b>{{ audience.firstname }}</b>?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteAudienceDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteAudience" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteAudiencesDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
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

<style scoped lang="scss"></style>
